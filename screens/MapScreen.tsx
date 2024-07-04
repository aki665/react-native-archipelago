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
  PropsWithChildren,
  memo,
  useContext,
  useEffect,
  useState,
} from "react";
import { View } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

import APMarkers from "./APMarkers";
import AsyncAlert from "../components/AsyncAlert";
import { ClientContext } from "../components/ClientContext";
import mapStyles from "../styles/MapStyles";
import getLocations from "../utils/getLocations";
import handleItems, { GOAL_MAP } from "../utils/handleItems";
import { STORAGE_TYPES, load, save } from "../utils/storageHandler";

export const MARKER_RADIUS = 20;

const MemoizedMap = memo(function MemoizedMap(props: PropsWithChildren) {
  return (
    <MapView provider={PROVIDER_GOOGLE} style={mapStyles.map} showsUserLocation>
      {props.children}
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
) => {
  const geofenceArr: Location.LocationRegion[] = trips.map((trip) => {
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
          client.locations.check(parseInt(region.identifier, 10));
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
  checkedLocations: readonly number[],
) => {
  return trips.filter((trip) => {
    return !checkedLocations.includes(trip.id);
  });
};

export type trip = {
  coords: {
    lat: number;
    lon: number;
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
}: Readonly<{
  sessionName: string;
  replacedInfo: boolean;
}>) {
  const client = useContext(ClientContext);

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [goalAchieved, setGoalAchieved] = useState<boolean>(false);
  const [trips, setTrips] = useState<any[] | trip[]>([]);
  const [checkedLocations, setCheckedLocations] = useState<readonly number[]>(
    [],
  );
  const [receivedKeys, setReceivedKeys] = useState<number>(0);
  const [receivedReductions, setReceivedReductions] = useState<number>(0);
  const [macguffinString, setMacguffinString] =
    useState<string>("Archipela-Go!");

  const handleCheckedLocation = async (checkedLocations: readonly number[]) => {
    if (checkedLocations.length > 0) {
      const filteredTrips = removeCheckedLocations(trips, checkedLocations);
      if (!goalAchieved) handleGoal(client, filteredTrips, macguffinString);
      setTrips(filteredTrips);
      console.log("saving filtered trips...");
      await save(filteredTrips, sessionName + "_trips", STORAGE_TYPES.OBJECT);
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

  const handleOfflineItems = async (
    items: readonly NetworkItem[],
    sessionName: string,
    newIndex: number,
  ) => {
    const goal: number = parseInt(
      JSON.stringify(client.data.slotData?.goal),
      10,
    );

    const { keyAmount, distanceReductions, macguffinString } =
      await handleItems(items, sessionName, newIndex, client, goal);
    setReceivedKeys(keyAmount);
    setReceivedReductions(distanceReductions);

    setMacguffinString(macguffinString);
  };

  const getCoordinatesForLocations = async () => {
    if (trips.length > 0 || goalAchieved) {
      console.log("Trips found. Exiting coordinate loading...");
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    const loadedTrips = await load(
      sessionName + "_trips",
      STORAGE_TYPES.OBJECT,
    );
    let filteredTrips: trip[];

    if ((!loadedTrips || replacedInfo) && client.data?.slotData.trips) {
      if (replacedInfo) {
        await save(0, sessionName + "_itemIndex", STORAGE_TYPES.NUMBER);
      }

      console.log("no saved data found. Generating new coordinates...");
      const tempTrips: any[] | trip[] = [];
      const tracker = { tripGroup: 0, theta: Math.random() * 2 * Math.PI };
      for (const [name, trip] of Object.entries(
        client.data?.slotData?.trips,
      ).sort((a, b) => a[1].key_needed - b[1].key_needed)) {
        //Makes the slot data into an array that is sorted by key_needed...
        const id =
          client.data.package.get("Archipela-Go!")?.location_name_to_id[name];
        if (client.locations.checked.includes(id)) continue;
        if (trip.key_needed !== tracker.tripGroup) {
          tracker.tripGroup = trip.key_needed;
          tracker.theta = Math.random() * 2 * Math.PI; // .. so the theta can be changed when key_needed changes.
        }
        const coords = await getLocations(
          location.coords,
          parseInt(JSON.stringify(client.data.slotData.maximum_distance), 10),
          parseInt(JSON.stringify(client.data.slotData.minimum_distance), 10),
          parseInt(JSON.stringify(client.data.slotData.speed_requirement), 10),
          trip,
          tracker.theta,
        );
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

    setTrips(filteredTrips);
    geofenceLocations(filteredTrips, client, receivedKeys, receivedReductions);
    if (sessionName)
      await save(filteredTrips, sessionName + "_trips", STORAGE_TYPES.OBJECT);
  };

  const roomUpdateListener = (packet: RoomUpdatePacket) => {
    console.log("starting room update listener...");
    if (packet.checked_locations) {
      setCheckedLocations(packet.checked_locations);
    }
  };

  const receivedItemsListener = async (packet: ReceivedItemsPacket) => {
    console.log("starting message listener...");

    const { keyAmount, distanceReductions, macguffinString } =
      await handleItems(packet.items, sessionName, packet.index, client);
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
    handleOfflineItems(client.items.received, sessionName, client.items.index);
    client.addListener(SERVER_PACKET_TYPE.ROOM_UPDATE, roomUpdateListener);
    client.addListener(
      SERVER_PACKET_TYPE.RECEIVED_ITEMS,
      receivedItemsListener,
    );
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
      geofenceLocations(trips, client, receivedKeys, receivedReductions);
    }
  }, [receivedKeys]);

  useEffect(() => {
    console.log("macguffinString changed to", macguffinString);
    if (!goalAchieved) handleGoal(client, trips, macguffinString);
  }, [macguffinString]);
  return (
    <View style={mapStyles.container}>
      <MemoizedMap>
        <APMarkers
          client={client}
          trips={trips}
          location={location}
          receivedKeys={receivedKeys}
        />
      </MemoizedMap>
    </View>
  );
}
