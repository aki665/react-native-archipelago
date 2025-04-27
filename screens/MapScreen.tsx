import {
  Client,
  Hint,
  JSONRecord,
  RoomUpdatePacket,
  clientStatuses,
  permissions,
} from "archipelago.js";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import React, {
  memo,
  MutableRefObject,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  Text,
  View,
} from "react-native";
import MapView, { Camera } from "react-native-maps";

import APMarkers from "./APMarkers";
import AsyncAlert from "../components/AsyncAlert";
import { ClientContext } from "../components/ClientContext";
import LocationInfoPopup, {
  REROLL_TIME,
} from "../components/LocationInfoPopup";
import { SettingsContext } from "../components/SettingsContext";
import mapStyles from "../styles/MapStyles";
import getLocations from "../utils/getLocations";
import handleItems, { GOAL_MAP, MAP_ID_TO_ITEM } from "../utils/handleItems";
import { STORAGE_TYPES, load, save } from "../utils/storageHandler";
import { FontAwesome } from "@expo/vector-icons";
import Popup from "../components/Popup";
import { useIsFocused } from "@react-navigation/native";

/**
 * This class is used to send location ids from the geofencing to the react code
 */
class LocationsEmitter {
  events: Record<string, ((data: any) => void)[]>;

  constructor() {
    this.events = {};
  }

  on(event: string, listener: (data?: any) => void) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    if (!this.events[event]?.includes(this.events[event][0]))
      this.events[event]?.push(listener);
  }

  emit(event: string, data: any) {
    const listeners = this.events[event];
    if (listeners) {
      listeners.forEach((listener) => listener(data));
    }
  }
  off(event: string) {
    if (this.events[event] != undefined) {
      this.events[event] = [];
    }
  }
}

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
  client.updateStatus(clientStatuses.goal);
  if (
    client.room.permissions.release === permissions.enabled ||
    client.room.permissions.release === permissions.goal
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
            client.messages.say("!release");
          },
        },
      ],
    );
  }
  if (
    client.room.permissions.collect === permissions.enabled ||
    client.room.permissions.collect === permissions.goal
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
            client.messages.say("!collect");
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
  MARKER_RADIUS: number,
  locationEmitter: LocationsEmitter,
) => {
  console.log("MARKER_RADIUS in geofenceLocations", MARKER_RADIUS);
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

  if (!TaskManager.isTaskDefined("apgo-geofencing")) {
    TaskManager.defineTask(
      "apgo-geofencing",
      async ({
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
          if (region.identifier !== undefined) {
            const id = parseInt(region.identifier, 10);
            locationEmitter.emit("locationEntered", id);
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
    osmID: string;
    duplicate: boolean;
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
  isDisconnecting,
}: Readonly<{
  sessionName: string;
  isDisconnecting: MutableRefObject<boolean>;
}>) {
  const { client } = useContext(ClientContext);
  const { getSetting } = useContext(SettingsContext);
  const NEAR_ZOOM = getSetting("NEAR_ZOOM", "boolean");
  const MARKER_RADIUS = getSetting("MARKER_RADIUS", "number");
  const LOCATION_RETRIES = getSetting("LOCATION_RETRIES", "number");

  const [showPopup, setShowPopup] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<null | trip>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [trips, setTrips] = useState<any[] | trip[]>(["placeholder"]);
  const [checkedLocations, setCheckedLocations] = useState<readonly number[]>(
    [],
  );
  const [receivedKeys, setReceivedKeys] = useState<number>(0);
  const [receivedReductions, setReceivedReductions] = useState<number>(0);
  const [macguffinString, setMacguffinString] =
    useState<string>("Archipela-Go!");
  const [goalAchieved, setGoalAchieved] = useState<boolean>(false);
  const [hintedProgTrips, setHintedProgTrips] = useState<number[]>([0]);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [generating, setGenerating] = useState(true);
  const [generatingStatus, setGeneratingStatus] = useState(
    "Checking for saved info...",
  );

  const isFocused = useIsFocused();

  const rerollAllowedRef = useRef<boolean>(true);
  const rerollTime = useRef<Date>(new Date());
  const slotData = useRef<JSONRecord | null>(null);
  const appState = useRef(AppState.currentState);
  const locationEmitter = useRef(new LocationsEmitter());

  const handleShowPopup = (trip: trip) => {
    setSelectedLocation(trip);
    setShowPopup(true);
  };
  const closePopup = () => {
    setShowPopup(false);
    setSelectedLocation(null);
  };

  const handleReroll = () => {
    console.log(new Date().getTime(), rerollTime.current.getTime());
    if (
      (new Date().getTime() - rerollTime.current.getTime()) / 1000 >
      REROLL_TIME
    ) {
      rerollAllowedRef.current = true;
    }
  };

  const handleGeofenceEnter = (id: number) => {
    console.log("handleGeofenceEnter id", id);
    setCheckedLocations((prev) => [...prev, id]);
  };

  const rerollSelectedLocation = async (
    id: number,
    name: string,
    loops = 0,
  ) => {
    if (slotData.current?.trips !== null && location !== null) {
      rerollAllowedRef.current = false;
      const oldTrip: trip = trips.find((trip: trip) => trip.id === id);
      const filteredTrips = removeCheckedLocations(trips, [id]);
      const trip = slotData.current?.trips[name];
      const coords = await getLocations(
        location.coords,
        parseInt(JSON.stringify(slotData.current?.maximum_distance), 10),
        parseInt(JSON.stringify(slotData.current?.minimum_distance), 10),
        parseInt(JSON.stringify(slotData.current?.speed_requirement), 10),
        trip,
        NEAR_ZOOM,
      );
      const isDuplicate = trips.some(
        (value) =>
          value.coords.lat === coords.lat && value.coords.lon === coords.lon,
      );
      coords.duplicate = isDuplicate;

      if (oldTrip.coords !== coords) {
        filteredTrips.push({ coords, trip, name, id });
        setTrips(filteredTrips);
        rerollTime.current = new Date();
        await save(filteredTrips, sessionName + "_trips", STORAGE_TYPES.OBJECT);
        setTimeout(() => {
          console.log("reroll is allowed again");
          handleReroll();
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
          { onDismiss: () => (rerollAllowedRef.current = true) },
        );
      } else rerollSelectedLocation(id, name, loops + 1);
    }
  };

  const handleCheckedLocation = async (checkedLocations: readonly number[]) => {
    console.log("new checked locations", checkedLocations);
    if (checkedLocations !== null && checkedLocations.length > 0) {
      console.log("all trips", trips);
      try {
        client.check([...checkedLocations]);
      } catch (e) {
        console.log("could not check locations");
      }
      const filteredTrips = removeCheckedLocations(trips, checkedLocations);
      if (!goalAchieved) handleGoal(client, filteredTrips, macguffinString);
      setTrips(filteredTrips);
      console.log("saving filtered trips...");
      if (sessionName && sessionName !== "") {
        await save(
          [...new Set(checkedLocations)],
          sessionName + "_checked",
          STORAGE_TYPES.OBJECT,
        );
      }
    }
  };

  const handleGoal = (
    client: Client,
    remainingTrips: trip[],
    macguffinString = "Archipela-Go!",
  ) => {
    const goal: number = parseInt(JSON.stringify(slotData.current?.goal), 10);
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
    if (sessionName && sessionName !== "") {
      const loadedChecks = await load(
        sessionName + "_checked",
        STORAGE_TYPES.OBJECT,
      );
      if (loadedChecks !== null) {
        setCheckedLocations((prev) => [...new Set([...prev, ...loadedChecks])]);
      }
    }
  };

  const getCoordinatesForLocations = async () => {
    if (trips[0] !== "placeholder" || goalAchieved) {
      console.log("Trips found. Exiting coordinate loading...");
      return;
    }
    setGenerating(true);
    const location = await Location.getCurrentPositionAsync();
    const data =
      slotData.current ?? (await client.players.self.fetchSlotData());
    slotData.current = data;

    const loadedTrips: trip[] = await load(
      sessionName + "_trips",
      STORAGE_TYPES.OBJECT,
    );
    let filteredTrips: trip[];

    if (loadedTrips === null && data.trips) {
      let index = 0;
      const tripAmount = Object.entries(data?.trips).length;
      setGeneratingStatus("No saved locations found. Starting generation...");
      const tempTrips: any[] | trip[] = [];
      const tracker = { tripGroup: 0, theta: Math.random() * 2 * Math.PI };
      for (const [name, trip] of Object.entries(data?.trips).sort(
        (a, b) => a[1].key_needed - b[1].key_needed,
      )) {
        index++;
        setGeneratingStatus(`Generating location ${index} of ${tripAmount}`);
        //Makes the slot data into an array that is sorted by key_needed...
        const id =
          client.package.findPackage("Archipela-Go!")?.locationTable[name];
        if (!id) return;
        if (client.room.checkedLocations.includes(id)) continue;
        if (trip.key_needed !== tracker.tripGroup) {
          tracker.tripGroup = trip.key_needed;
          tracker.theta = Math.random() * 2 * Math.PI; // .. so the theta can be changed when key_needed changes.
        }
        let generatingCoords = true;
        let coords = { lat: 0, lon: 0, osmID: "0", duplicate: false };
        let loopCount = 0;

        while (generatingCoords && !isDisconnecting.current) {
          if (!client.socket.connected) generatingCoords = false;

          coords = await getLocations(
            location.coords,
            parseInt(JSON.stringify(data.maximum_distance), 10),
            parseInt(JSON.stringify(data.minimum_distance), 10),
            parseInt(JSON.stringify(data.speed_requirement), 10),
            trip,
            NEAR_ZOOM,
          );
          generatingCoords = tempTrips.some(
            (value) =>
              value.coords.lat === coords.lat &&
              value.coords.lon === coords.lon,
          );
          coords.duplicate = generatingCoords;
          console.log("Generated unique coordinates?", !generatingCoords);
          if (loopCount === LOCATION_RETRIES) generatingCoords = false;
          loopCount++;
        }

        tempTrips.push({ coords, trip, name, id });
      }
      setGeneratingStatus(
        "Locations generated. Filtering checked locations...",
      );
      filteredTrips = removeCheckedLocations(
        tempTrips,
        client.room.checkedLocations,
      );
    } else {
      setGeneratingStatus("Locations loaded. Filtering checked locations...");
      filteredTrips = removeCheckedLocations(
        loadedTrips,
        client.room.checkedLocations,
      );
    }

    filteredTrips.forEach(async (trip) => {
      if (trip.coords.osmID === "0") {
        const newCoords = await getLocations(
          location.coords,
          parseInt(JSON.stringify(data.maximum_distance), 10),
          parseInt(JSON.stringify(data.minimum_distance), 10),
          parseInt(JSON.stringify(data.speed_requirement), 10),
          trip.trip,
          NEAR_ZOOM,
        );
        newCoords.duplicate = filteredTrips.some(
          (value) =>
            value.coords.lat === newCoords.lat &&
            value.coords.lon === newCoords.lon,
        );
        trip.coords = newCoords;
      }
    });
    const keyAmount = client.items.received.map(
      (item) => item.id === MAP_ID_TO_ITEM.KEY,
    ).length;
    setTrips(filteredTrips);
    geofenceLocations(
      filteredTrips,
      client,
      keyAmount,
      receivedReductions,
      MARKER_RADIUS,
      locationEmitter.current,
    );
    if (sessionName && sessionName !== "") {
      setGeneratingStatus("Saving generated locations...");
      await save(filteredTrips, sessionName + "_trips", STORAGE_TYPES.OBJECT);
    }
    setGenerating(false);
    setRefresh((prevState) => !prevState);
  };

  const roomUpdateListener = (packet: RoomUpdatePacket) => {
    if (packet.checked_locations !== undefined) {
      const roomCheckedLocations = packet.checked_locations; //Stops typescript from yelling at me
      setCheckedLocations((prev) => [
        ...new Set([...prev, ...roomCheckedLocations]),
      ]);
    }
  };

  const receivedItemsListener = async () => {
    console.log("starting message listener...");
    let index = -1;
    try {
      index = await load(sessionName + "_itemIndex", STORAGE_TYPES.NUMBER);
      console.log("loaded index", index);
    } catch {
      console.log("failed to load index");
    }
    const goal: number = parseInt(JSON.stringify(slotData.current?.goal), 10);

    console.log(
      "handling items, with ",
      client.items.received.length,
      "received and loaded index at",
      index,
    );
    const { keyAmount, distanceReductions, macguffinString } =
      await handleItems(client.items.received, client, goal, index);
    if (sessionName && sessionName !== "") {
      await save(
        client.items.count,
        sessionName + "_itemIndex",
        STORAGE_TYPES.NUMBER,
      );
    }
    setReceivedKeys(keyAmount);
    setReceivedReductions(distanceReductions);
    setMacguffinString(macguffinString);
  };

  const hintsReceivedListener = async (hint: Hint) => {
    if (hint.item.useful || hint.item.progression)
      setHintedProgTrips((prevState) => [...prevState, hint.item.locationId]);
  };

  const handleRefresh = () => {
    handleReconnect();
    setRefresh((prevState) => !prevState);
  };

  const handleReconnect = async () => {
    handleReroll();

    if (trips[0] !== "placeholder") {
      geofenceLocations(
        trips,
        client,
        receivedKeys,
        receivedReductions,
        MARKER_RADIUS,
        locationEmitter.current,
      );
    }
    await getCoordinatesForLocations();
    await handleOfflineChecks();
    await receivedItemsListener();

    const hints = client.items.hints;
    const hintedProgressionLocations = hints
      .filter(
        (hint) =>
          (hint.item.sender.slot === client.players.self.slot &&
            hint.item.progression) ||
          hint.item.useful,
      )
      .map((hint) => hint.item.locationId);
    setHintedProgTrips(hintedProgressionLocations);
    //handleOfflineItems(client.items.received, sessionName, client.items.count);
    if (!goalAchieved) handleGoal(client, trips, macguffinString);
  };

  useEffect(() => {
    Location.getCurrentPositionAsync()
      .then((location) => setLocation(location))
      .catch((e) => console.log(e));

    client.players.self
      .fetchSlotData()
      .then((data) => {
        slotData.current = data;
      })
      .catch((e) => console.log(e));

    handleReconnect();
    client.socket.on("connected", handleReconnect);
    client.socket.on("roomUpdate", roomUpdateListener);
    client.socket.on("receivedItems", receivedItemsListener);
    client.items.on("hintReceived", hintsReceivedListener);
    locationEmitter.current.on("locationEntered", handleGeofenceEnter);

    console.log(
      "client.items.received.length",
      client.items.received.length,
      client.items.count,
    );

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      console.log("app state changed. Next state is", nextAppState);
      if (nextAppState === "active") {
        handleReroll();
        const keyAmount = client.items.received.map(
          (item) => item.id === MAP_ID_TO_ITEM.KEY,
        ).length;
        geofenceLocations(
          trips,
          client,
          keyAmount,
          receivedReductions,
          MARKER_RADIUS,
          locationEmitter.current,
        );
      }
      appState.current = nextAppState;
    });
    return () => {
      subscription.remove();
      removeGeofencing();
      client.socket.off("connected", handleReconnect);
      client.socket.off("roomUpdate", roomUpdateListener);
      client.socket.off("receivedItems", receivedItemsListener);
    };
  }, []);

  useEffect(() => {
    console.log("checkedLocations changed");
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
    if (trips[0] === "placeholder") {
      // don't do anything on first render
    } else {
      //removeGeofencing();
      geofenceLocations(
        trips,
        client,
        receivedKeys,
        receivedReductions,
        MARKER_RADIUS,
        locationEmitter.current,
      );
    }
  }, [receivedKeys, trips]);

  useEffect(() => {
    setRefresh((prevState) => !prevState);
  }, [trips]);

  useEffect(() => {
    console.log("macguffinString changed to", macguffinString);
    if (!goalAchieved) handleGoal(client, trips, macguffinString);
  }, [macguffinString]);

  return (
    <View style={mapStyles.container}>
      <Pressable
        style={mapStyles.refreshButton}
        onPress={() => {
          handleRefresh();
        }}
      >
        <View>
          <FontAwesome name="refresh" size={24} color="black" />
        </View>
      </Pressable>
      <LocationInfoPopup
        visible={showPopup}
        closePopup={closePopup}
        location={selectedLocation}
        client={client}
        receivedKeys={receivedKeys}
        rerollSelectedLocation={rerollSelectedLocation}
        rerollAllowed={rerollAllowedRef}
        rerollTime={rerollTime}
        setLocationAsFound={handleGeofenceEnter}
      />
      <Popup
        closePopup={() => {}}
        visible={generating && isFocused}
        animationType="fade"
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>{generatingStatus}</Text>
      </Popup>
      <MemoizedMap location={location}>
        <APMarkers
          trips={trips}
          receivedKeys={receivedKeys}
          handleShowPopup={handleShowPopup}
          hintedProgTrips={hintedProgTrips}
          refresh={refresh}
        />
      </MemoizedMap>
    </View>
  );
}
