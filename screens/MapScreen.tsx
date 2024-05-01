import * as Location from "expo-location";
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
import { load, save } from "../utils/storageHandler";

const MemoizedMap = memo(function MemoizedMap(props: PropsWithChildren) {
  return (
    <MapView provider={PROVIDER_GOOGLE} style={mapStyles.map} showsUserLocation>
      {props.children}
    </MapView>
  );
});

export type trip = {
  coords: {
    lat: number;
    lon: number;
  }[];
  trip: {
    amount: number;
    distance_tier: number;
    key_needed: number;
    speed_tier: number;
  };
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [trips, setTrips] = useState<any[] | trip[]>([]);

  const getCoordinatesForLocations = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setErrorMsg("Permission to access location was denied");
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    const loadedTrips = await load(sessionName + "_trips");

    if ((!loadedTrips || replacedInfo) && client.data?.slotData.trips) {
      console.log("no saved data found. Generating new coordinates...");
      const tempTrips: any[] | trip[] = [];
      console.log(client.data?.slotData?.trips?.length);
      for (const trip of client.data?.slotData?.trips) {
        const coords = await getLocations(
          location.coords,
          client.data?.slotData.maximum_distance,
          client.data?.slotData.minimum_distance,
          client.data?.slotData.speed_requirement,
          trip,
        );
        tempTrips.push({ coords, trip });
      }
      setTrips(tempTrips);
      if (sessionName) await save(tempTrips, sessionName + "_trips");
    } else {
      setTrips(loadedTrips);
    }
  };

  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    };
    getLocation();
    getCoordinatesForLocations(); //TODO: fix this happening on every render

    const locationTimeOut = setInterval(getLocation, 10000);
    return () => {
      clearInterval(locationTimeOut);
    };
  }, []);
  return (
    <View style={mapStyles.container}>
      <MemoizedMap>
        <APMarkers client={client} trips={trips} location={location} />
      </MemoizedMap>
    </View>
  );
}
