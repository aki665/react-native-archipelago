import {
  CLIENT_STATUS,
  Client,
  NetworkItem,
  PERMISSION,
  ReceivedItemsPacket,
  RoomUpdatePacket,
  SERVER_PACKET_TYPE,
} from "archipelago.js";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import React, {
  ReactNode,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert, View } from "react-native";
import MapView, { Camera } from "react-native-maps";

import APMarkers from "./APMarkers";
import AsyncAlert from "../components/AsyncAlert";
import { ClientContext } from "../components/ClientContext";
import LocationInfoPopup, {
  REROLL_TIME,
} from "../components/LocationInfoPopup";
import mapStyles from "../styles/MapStyles";
import getLocations from "../utils/getLocations";
import handleItems, { GOAL_MAP, MAP_ID_TO_ITEM } from "../utils/handleItems";
import { STORAGE_TYPES, load, save } from "../utils/storageHandler";

export const MARKER_RADIUS = 20;

const MemoizedMap = memo(function MemoizedMap({
  children,
  location,
}: {
  children: ReactNode;
  location: Location.LocationObject | null;
}) {
  const mapRef = useRef<MapView | null>(null);

  const onMapReady = () => {
    let camera: Camera | null = null;
    if (location)
      camera = {
        altitude: 3,
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        heading: 0,
        pitch: 0,
        zoom: 15,
      };
    if (camera !== null && mapRef.current !== null) {
      mapRef?.current.setCamera(camera);
    }
  };
  return (
    <MapView
      ref={mapRef}
      style={mapStyles.map}
      userLocationUpdateInterval={1000}
      showsUserLocation
      onMapReady={onMapReady}
    >
      {children}
    </MapView>
  );
});

const sendGoal = async (client: Client) => {
  client.updateStatus(CLIENT_STATUS.GOAL);
  if (
    client.data.permissions.release === PERMISSION.ENABLED ||
    client.data.permissions.release === PERMISSION.GOAL
  ) {
    await AsyncAlert(
      "Goal Achieved",
      "Do you want to send the remaining items from your world? (Runs the !release command)",
      [
        {
          text: "Cancel",
          onPress: () => null,
          style: "cancel",
        },
        {
          text: "YES",
          onPress: () => {
            client.say("!release");
          },
        },
      ],
    );
  }
  if (
    client.data.permissions.collect === PERMISSION.ENABLED ||
    client.data.permissions.collect === PERMISSION.GOAL
  ) {
    await AsyncAlert(
      "Goal Achieved",
      "Do you want to collect the remaining items from your world? (Runs the !collect command)",
      [
        {
          text: "Cancel",
          onPress: () => null,
          style: "cancel",
        },
        {
          text: "YES",
          onPress: () => {
            client.say("!collect");
          },
        },
      ],
    );
  }
};

const geofenceLocations = async (
  trips: trip[],
  client: Client,
  receivedKeys: number,
  receivedReductions: number,
  setCheckedLocations: React.Dispatch<React.SetStateAction<readonly number[]>>,
) => {
  const geofenceArr = trips.map((trip) => {
    if (receivedKeys >= trip.trip.key_needed) {
      return {
        identifier: trip.id.toString(),
        latitude: trip.coords.lat,
        longitude: trip.coords.lon,
        radius: MARKER_RADIUS,
      };
    }
  });
  const filteredGeofenceArr = geofenceArr.filter((_) => _ !== undefined);

  console.log(filteredGeofenceArr);
  if (!TaskManager.isTaskDefined("apgo-geofencing")) {
    TaskManager.defineTask(
      "apgo-geofencing",
      ({
        data: { eventType, region },
        error,
      }: {
        data: {
          eventType: Location.GeofencingEventType;
          region: Location.LocationRegion;
        };
        error: TaskManager.TaskManagerError | null;
      }) => {
        if (error) {
          console.log(error);
          return;
        }
        if (eventType === Location.GeofencingEventType.Enter) {
          console.log("entered location with id", region.identifier);
          if (region.identifier !== undefined) {
            const id = parseInt(region.identifier, 10);
            setCheckedLocations((prev) => [...prev, id]);
            try {
              client.locations.check(id);
            } catch {
              console.log("could not send item");
            }
          }
        }
      },
    );
  }
  if (await Location.hasStartedGeofencingAsync("apgo-geofencing")) {
    await Location.stopGeofencingAsync("apgo-geofencing");
    console.log("apgo-geofencing is defined");
  }

  await Location.startGeofencingAsync("apgo-geofencing", filteredGeofenceArr);
};

const removeGeofencing = async () => {
  if (await Location.hasStartedGeofencingAsync("apgo-geofencing")) {
    await Location.stopGeofencingAsync("apgo-geofencing");
    console.log("apgo-geofencing is defined");
  }
};
/**
 * Remove the given array of ids from the given array of trips
 */
const removeCheckedLocations = (
  trips: trip[],
  checkedLocations: number[] | readonly number[],
) => {
  return trips.filter((trip) => {
    return !checkedLocations.includes(trip.id);
  });
};

export type trip = {
  coords: {
    lat: number;
    lon: number;
    osmID: number;
  };
  trip: {
    amount: number;
    distance_tier: number;
    key_needed: number;
    speed_tier: number;
  };
  name: string;
  id: number;
};

export default function MapScreen({
  sessionName,
  replacedInfo,
  refreshClientListeners,
}: Readonly<{
  sessionName: string;
  replacedInfo: boolean;
  refreshClientListeners: boolean;
}>) {
  const { client } = useContext(ClientContext);

  const [showPopup, setShowPopup] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<null | trip>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [trips, setTrips] = useState<any[] | trip[]>([]);
  const [checkedLocations, setCheckedLocations] = useState<readonly number[]>(
    [],
  );
  const [receivedKeys, setReceivedKeys] = useState<number>(0);
  const [receivedReductions, setReceivedReductions] = useState<number>(0);
  const [macguffinString, setMacguffinString] =
    useState<string>("Archipela-Go!");
  const [goalAchieved, setGoalAchieved] = useState<boolean>(false);
  const rerollAllowedRef = useRef<boolean>(true);

  const handleShowPopup = (trip: trip) => {
    setSelectedLocation(trip);
    setShowPopup(true);
  };
  const closePopup = () => {
    setShowPopup(false);
    setSelectedLocation(null);
  };

  const rerollSelectedLocation = async (
    id: number,
    name: string,
    loops = 0,
  ) => {
    if (client.data.slotData.trips !== null && location !== null) {
      rerollAllowedRef.current = false;
      const oldTrip: trip = trips.find((trip: trip) => trip.id === id);
      const filteredTrips = removeCheckedLocations(trips, [id]);
      const trip = client.data?.slotData?.trips[name];
      const coords = await getLocations(
        location.coords,
        parseInt(JSON.stringify(client.data.slotData.maximum_distance), 10),
        parseInt(JSON.stringify(client.data.slotData.minimum_distance), 10),
        parseInt(JSON.stringify(client.data.slotData.speed_requirement), 10),
        trip,
      );
      if (oldTrip.coords !== coords) {
        filteredTrips.push({ coords, trip, name, id });
        setTrips(filteredTrips);
        setTimeout(() => {
          console.log("reroll is allowed again");
          rerollAllowedRef.current = true;
        }, REROLL_TIME * 1000);
      } else if (loops > 5) {
        Alert.alert(
          "Reroll failed",
          "After 5 tries, the location could not be rerolled.\nLocation has not been changed and reroll is not on cooldown.",
          [
            {
              text: "OK",
              onPress: () => (rerollAllowedRef.current = true),
              style: "default",
            },
          ],
        );
      } else rerollSelectedLocation(id, name, loops + 1);
    }
  };

  const handleCheckedLocation = async (checkedLocations: readonly number[]) => {
    if (checkedLocations !== null && checkedLocations.length > 0) {
      const filteredTrips = removeCheckedLocations(trips, checkedLocations);
      if (!goalAchieved) handleGoal(client, filteredTrips, macguffinString);
      setTrips(filteredTrips);
      console.log("saving filtered trips...");
      await save(filteredTrips, sessionName + "_trips", STORAGE_TYPES.OBJECT);
      await save(
        [...new Set(checkedLocations)],
        sessionName + "_checked",
        STORAGE_TYPES.OBJECT,
      );
    }
  };

  const handleGoal = (
    client: Client,
    remainingTrips: trip[],
    macguffinString = "Archipela-Go!",
  ) => {
    const goal: number = parseInt(
      JSON.stringify(client.data.slotData?.goal),
      10,
    );
    switch (goal) {
      case GOAL_MAP.ALLSANITY:
        if (remainingTrips.length === 0) {
          sendGoal(client);
          setGoalAchieved(true);
        }
        break;
      case GOAL_MAP.SHORT_MACGUFFIN:
      case GOAL_MAP.LONG_MACGUFFIN:
        if (macguffinString.length === 0) {
          sendGoal(client);
          setGoalAchieved(true);
        }
        break;
      default:
        console.log("Goal not reached");
        break;
    }
  };

  const handleOfflineChecks = async () => {
    const loadedChecks = await load(
      sessionName + "_checked",
      STORAGE_TYPES.OBJECT,
    );
    if (loadedChecks !== null) {
      setCheckedLocations(loadedChecks);
    }
  };

  const handleOfflineItems = async (
    items: readonly NetworkItem[],
    sessionName: string,
    newIndex: number,
  ) => {
    let index = -1;
    try {
      index = await load(sessionName + "_itemIndex", STORAGE_TYPES.NUMBER);
    } catch {
      console.log("failed to load index");
    }
    const { keyAmount, distanceReductions, macguffinString } =
      await handleItems(items, client, index);
    await save(newIndex, sessionName + "_itemIndex", STORAGE_TYPES.NUMBER);

    setReceivedKeys(keyAmount);
    setReceivedReductions(distanceReductions);

    setMacguffinString(macguffinString);
  };

  const getCoordinatesForLocations = async () => {
    if (trips.length > 0 || goalAchieved) {
      console.log("Trips found. Exiting coordinate loading...");
      return;
    }
    const location = await Location.getCurrentPositionAsync();

    const loadedTrips = await load(
      sessionName + "_trips",
      STORAGE_TYPES.OBJECT,
    );
    let filteredTrips: trip[];

    if (
      (loadedTrips?.length === 0 || replacedInfo) &&
      client.data?.slotData.trips
    ) {
      if (replacedInfo) {
        await save(0, sessionName + "_itemIndex", STORAGE_TYPES.NUMBER);
      }

      console.log("no saved data found. Generating new coordinates...");
      const tempTrips: any[] | trip[] = [];
      const tracker = { tripGroup: 0, theta: Math.random() * 2 * Math.PI };
      for (const [name, trip] of Object.entries(
        client.data?.slotData?.trips,
      ).sort((a, b) => a[1].key_needed - b[1].key_needed)) {
        console.log("Generating trip", name);
        //Makes the slot data into an array that is sorted by key_needed...
        const id =
          client.data.package.get("Archipela-Go!")?.location_name_to_id[name];
        if (!id) return;
        if (client.locations.checked.includes(id)) continue;
        if (trip.key_needed !== tracker.tripGroup) {
          tracker.tripGroup = trip.key_needed;
          tracker.theta = Math.random() * 2 * Math.PI; // .. so the theta can be changed when key_needed changes.
        }
        let generatingCoords = true;
        let coords = { lat: 0, lon: 0 };

        while (generatingCoords) {
          //TODO: Add logic to break out of this loop if in it for too long
          coords = await getLocations(
            location.coords,
            parseInt(JSON.stringify(client.data.slotData.maximum_distance), 10),
            parseInt(JSON.stringify(client.data.slotData.minimum_distance), 10),
            parseInt(
              JSON.stringify(client.data.slotData.speed_requirement),
              10,
            ),
            trip,
          );
          generatingCoords = tempTrips.some(
            (value) =>
              value.coords.lat === coords.lat &&
              value.coords.lon === coords.lon,
          );
          console.log("Generated unique coordinates?", !generatingCoords);
        }

        tempTrips.push({ coords, trip, name, id });
      }
      filteredTrips = removeCheckedLocations(
        tempTrips,
        client.locations.checked,
      );
    } else {
      filteredTrips = removeCheckedLocations(
        loadedTrips,
        client.locations.checked,
      );
    }
    const keyAmount = client.items.received.map(
      (item) => item.item === MAP_ID_TO_ITEM.KEY,
    ).length;
    setTrips(filteredTrips);
    geofenceLocations(
      filteredTrips,
      client,
      keyAmount,
      receivedReductions,
      setCheckedLocations,
    );
    if (sessionName)
      await save(filteredTrips, sessionName + "_trips", STORAGE_TYPES.OBJECT);
  };

  const roomUpdateListener = (packet: RoomUpdatePacket) => {
    console.log("starting room update listener...");
    if (packet.checked_locations !== undefined) {
      const checkedLocations = packet.checked_locations; //Stops typescript from yelling at me
      setCheckedLocations((prev) => [
        ...new Set([...prev, ...checkedLocations]),
      ]);
    }
  };

  const receivedItemsListener = async (packet: ReceivedItemsPacket) => {
    console.log("starting message listener...");
    let index = -1;
    try {
      index = await load(sessionName + "_itemIndex", STORAGE_TYPES.NUMBER);
      console.log("loaded index", index);
    } catch {
      console.log("failed to load index");
    }

    console.log(
      "handling items, with ",
      client.items.received.length,
      "recieved and loaded index at",
      index,
      "and recieved index at ",
      packet.index,
    );
    const { keyAmount, distanceReductions, macguffinString } =
      await handleItems(client.items.received, client, index);
    await save(
      client.items.index,
      sessionName + "_itemIndex",
      STORAGE_TYPES.NUMBER,
    );
    setReceivedKeys(keyAmount);
    setReceivedReductions(distanceReductions);
    setMacguffinString(macguffinString);
  };

  useEffect(() => {
    const getLocation = async () => {
      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    };
    getLocation();
    getCoordinatesForLocations(); //TODO: fix this happening on every render
    if (!goalAchieved) handleGoal(client, trips, macguffinString);
    return () => {
      removeGeofencing();
      client.removeListener(SERVER_PACKET_TYPE.ROOM_UPDATE, roomUpdateListener);
      client.removeListener(
        SERVER_PACKET_TYPE.RECEIVED_ITEMS,
        receivedItemsListener,
      );
    };
  }, []);

  useEffect(() => {
    handleCheckedLocation(checkedLocations);
  }, [checkedLocations]);

  useEffect(() => {
    if (trips.length === 0) {
      // don't do anything on first render
    } else {
      //TODO make this change geofencing
      //removeGeofencing();
    }
  }, [receivedReductions]);

  useEffect(() => {
    if (trips.length === 0) {
      // don't do anything on first render
    } else {
      //removeGeofencing();
      geofenceLocations(
        trips,
        client,
        receivedKeys,
        receivedReductions,
        setCheckedLocations,
      );
    }
  }, [receivedKeys, trips]);

  useEffect(() => {
    console.log("macguffinString changed to", macguffinString);
    if (!goalAchieved) handleGoal(client, trips, macguffinString);
  }, [macguffinString]);

  useEffect(() => {
    if (refreshClientListeners) {
      try {
        client.removeListener(
          SERVER_PACKET_TYPE.ROOM_UPDATE,
          roomUpdateListener,
        );
        client.removeListener(
          SERVER_PACKET_TYPE.RECEIVED_ITEMS,
          receivedItemsListener,
        );
      } catch {
        console.log("client listeners did not exist");
      }
      client.addListener(SERVER_PACKET_TYPE.ROOM_UPDATE, roomUpdateListener);
      client.addListener(
        SERVER_PACKET_TYPE.RECEIVED_ITEMS,
        receivedItemsListener,
      );
      handleOfflineChecks();
      handleOfflineItems(
        client.items.received,
        sessionName,
        client.items.index,
      );
    }
  }, [refreshClientListeners]);
  return (
    <View style={mapStyles.container}>
      <LocationInfoPopup
        visible={showPopup}
        closePopup={closePopup}
        location={selectedLocation}
        client={client}
        receivedKeys={receivedKeys}
        rerollSelectedLocation={rerollSelectedLocation}
        rerollAllowed={rerollAllowedRef}
      />
      <MemoizedMap location={location}>
        <APMarkers
          trips={trips}
          receivedKeys={receivedKeys}
          handleShowPopup={handleShowPopup}
        />
      </MemoizedMap>
    </View>
  );
}
