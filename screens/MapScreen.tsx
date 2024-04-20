import { Client } from "archipelago.js";
import * as Location from "expo-location";
import React, { PropsWithChildren, memo, useEffect, useState } from "react";
import { View } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

import APMarkers from "./APMarkers";
import mapStyles from "../styles/MapStyles";
import getLocations from "../utils/getLocations";

const MemoizedMap = memo(function MemoizedMap(props: PropsWithChildren) {
  return (
    <MapView provider={PROVIDER_GOOGLE} style={mapStyles.map} showsUserLocation>
      {props.children}
    </MapView>
  );
});

export type trip = {
  coords: [
    {
      lat: number;
      lon: number;
    },
  ];
  trip: {
    amount: number;
    distance_tier: number;
    key_needed: number;
    speed_tier: number;
  };
};

export default function MapScreen({
  client,
}: Readonly<{
  client: Client;
}>) {
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
    if (client.data?.slotData.trips) {
      client.data?.slotData?.trips?.forEach(async (trip) => {
        const coords = await getLocations(
          location.coords,
          client.data?.slotData.maximum_distance,
          client.data?.slotData.minimum_distance,
          client.data?.slotData.speed_requirement,
          trip,
        );
        setTrips((prevState) => [...prevState, { coords, trip }]);
      });
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
