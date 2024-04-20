import { Client } from "archipelago.js";
import * as Location from "expo-location";
import React from "react";
import { Image } from "react-native";
import { Marker } from "react-native-maps";

import { trip } from "./MapScreen";

function APMarker({
  trip,
}: Readonly<{
  trip: trip;
}>) {
  return (
    <>
      {trip.coords.map((trip) => {
        return (
          <Marker
            coordinate={{ latitude: trip.lat, longitude: trip.lon }}
            key={`${trip.lat}&${trip.lon}`}
          >
            <Image
              source={require("../assets/color-icon.png")}
              style={{ width: 26, height: 28 }}
              resizeMode="center"
              resizeMethod="resize"
            />
          </Marker>
        );
      })}
    </>
  );
}

export default function APMarkers({
  client,
  trips,
  location,
}: Readonly<{
  client: Client;
  trips: any[] | trip[];
  location: Location.LocationObject | null;
}>) {
  return (
    <>
      {trips.map((trip: trip) => {
        return (
          <APMarker
            trip={trip}
            key={`${trip.coords[0].lat}-${trip.coords[0].lon}-${trip.trip.distance_tier}`}
          />
        );
      })}
    </>
  );
}
