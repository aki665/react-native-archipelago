import { Client, SERVER_PACKET_TYPE } from "archipelago.js";
import * as Location from "expo-location";
import React, { memo, useContext } from "react";
import { Image } from "react-native";
import { Circle, Marker } from "react-native-maps";

import { trip } from "./MapScreen";
import { ClientContext } from "../components/ClientContext";

const MemoizedMarker = memo(function APMarker({
  trip,
  receivedKeys
}: Readonly<{
  trip: trip;
  receivedKeys:number
}>) {
  const canCheck = receivedKeys >=trip.trip.key_needed
  console.log(`${receivedKeys}>=${trip.trip.key_needed}=${canCheck}`)
  return (
    <>
      <Circle
        center={{ latitude: trip.coords.lat, longitude: trip.coords.lon }}
        radius={20}
        strokeColor="blue"
        fillColor="rgba(0,0,0,0)"
        key={`${trip.coords.lat}&${trip.coords.lon}-circle`}
      />
      <Marker
        coordinate={{ latitude: trip.coords.lat, longitude: trip.coords.lon }}
        key={`${trip.coords.lat}&${trip.coords.lon}-marker`}
      >
        <Image
          source={require("../assets/APMarker_blue.png")}
          style={{ width: 50, height: 50}}
          resizeMode="center"
          resizeMethod="resize"
          tintColor={!canCheck ? "gray" : ""}
        />
      </Marker>
    </>
  );
});

export default function APMarkers({
  trips,
  location,
  receivedKeys
}: Readonly<{
  client: Client;
  trips: any[] | trip[];
  location: Location.LocationObject | null;
  receivedKeys:number
}>) {
  return (
    <>
      {trips.map((trip: trip) => {
        return <MemoizedMarker trip={trip} key={`${trip.name}`} receivedKeys={receivedKeys} />;
      })}
    </>
  );
}
