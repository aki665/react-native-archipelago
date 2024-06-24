import { Client, NetworkItem, SERVER_PACKET_TYPE } from "archipelago.js";
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
import { ClientContext } from "../components/ClientContext";
import mapStyles from "../styles/MapStyles";
import getLocations from "../utils/getLocations";
import handleItems from "../utils/handleItems";
import { STORAGE_TYPES, load, save } from "../utils/storageHandler";

export const MARKER_RADIUS = 20;

const MemoizedMap = memo(function MemoizedMap(props: PropsWithChildren) {
  return (
    <MapView provider={PROVIDER_GOOGLE} style={mapStyles.map} showsUserLocation>
      {props.children}
    </MapView>
  );
});

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
  console.log(await Location.hasStartedGeofencingAsync("apgo-geofencing"));
  await Location.stopGeofencingAsync("apgo-geofencing");
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
  const [trips, setTrips] = useState<any[] | trip[]>([]);
  const [checkedLocations, setCheckedLocations] = useState<readonly number[]>(
    [],
  );
  const [receivedKeys, setReceivedKeys] = useState<number>(0);
  const [receivedReductions, setReceivedReductions] = useState<number>(0);
  const handleCheckedLocation = async (checkedLocations: readonly number[]) => {
    if (checkedLocations.length > 0) {
      const filteredTrips = removeCheckedLocations(trips, checkedLocations);
      setTrips(filteredTrips);
      console.log("saving filtered trips...");
      await save(filteredTrips, sessionName + "_trips", STORAGE_TYPES.OBJECT);
    }
  };

  const handleOfflineItems = async (
    items: readonly NetworkItem[],
    sessionName: string,
    newIndex: number,
  ) => {
    const { keyAmount, distanceReductions } = await handleItems(
      items,
      sessionName,
      newIndex,
    );
    setReceivedKeys(keyAmount);
    setReceivedReductions(distanceReductions);
  };

  const getCoordinatesForLocations = async () => {
    if (trips.length > 0) {
      console.log("Trips found. Existing coordinate loading...");
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    const loadedTrips = await load(
      sessionName + "_trips",
      STORAGE_TYPES.OBJECT,
    );
    let filteredTrips: trip[];

    if ((!loadedTrips || replacedInfo) && client.data?.slotData.trips) {
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
          client.data.slotData.maximum_distance,
          client.data?.slotData.minimum_distance,
          client.data?.slotData.speed_requirement,
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

  useEffect(() => {
    const getLocation = async () => {
      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    };
    handleOfflineItems(client.items.received, sessionName, client.items.index);
    getLocation();
    getCoordinatesForLocations(); //TODO: fix this happening on every render
    client.addListener(SERVER_PACKET_TYPE.ROOM_UPDATE, (packet) => {
      console.log("starting room update listener...");
      if (packet.checked_locations) {
        setCheckedLocations(packet.checked_locations);
      }
    });
    client.addListener(SERVER_PACKET_TYPE.RECEIVED_ITEMS, async (packet) => {
      console.log("starting message listener...");
      console.log(packet.items);
      const { keyAmount, distanceReductions } = await handleItems(
        packet.items,
        sessionName,
        packet.index,
      );
      setReceivedKeys(keyAmount);
      setReceivedReductions(distanceReductions);
    });
    return () => {
      removeGeofencing();
      client.removeListener(SERVER_PACKET_TYPE.ROOM_UPDATE, (packet) => {
        console.log("starting room update listener...");
        if (packet.checked_locations) {
          setCheckedLocations(packet.checked_locations);
        }
      });
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
    console.log("receivedKeys", receivedKeys);
    if (trips.length === 0) {
      // don't do anything on first render
    } else {
      //removeGeofencing();
      geofenceLocations(trips, client, receivedKeys, receivedReductions);
    }
  }, [receivedKeys]);
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
