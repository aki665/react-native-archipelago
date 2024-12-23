import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useNavigation } from "@react-navigation/native";
import React, { memo, useContext, useEffect, useRef, useState } from "react";
import { Image, Text, View } from "react-native";
import { Callout, Circle, Marker } from "react-native-maps";

import { trip } from "./MapScreen";
import { SettingsContext } from "../components/SettingsContext";

const getMarker = (canCheck: boolean, hinted: boolean) => {
  if (canCheck && hinted) return require("../assets/APMarker_Hint.png");
  else if (canCheck) return require("../assets/APMarker_blue.png");
  else if (hinted) return require("../assets/APMarker_Hint_gray.png");
  else return require("../assets/APMarker_gray.png");
};

const MemoizedMarker = memo(function APMarker({
  trip,
  receivedKeys,
  handleShowPopup,
  MARKER_RADIUS,
  hinted,
}: Readonly<{
  trip: trip;
  receivedKeys: number;
  handleShowPopup: (item: trip) => void;
  MARKER_RADIUS: number;
  hinted: boolean;
}>) {
  const navigation = useNavigation();
  const canCheck = receivedKeys >= trip.trip.key_needed;
  const coordinates = useRef({
    latitude: trip.coords.duplicate
      ? trip.coords.lat + (Math.random() - 0.5) / 8300
      : trip.coords.lat,
    longitude: trip.coords.duplicate
      ? trip.coords.lon + (Math.random() - 0.5) / 8300
      : trip.coords.lon,
  });
  const firstRenderDone = useRef(false);
  //console.log(`${receivedKeys}>=${trip.trip.key_needed}=${canCheck}`);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  useEffect(() => {
    setTracksViewChanges(true);
    setTimeout(() => {
      setTracksViewChanges(false);
    }, 200);
  }, [receivedKeys, trip]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!firstRenderDone.current) {
        setTracksViewChanges(true);
        setTimeout(() => {
          setTracksViewChanges(false);
        }, 200);
        firstRenderDone.current = true;
        unsubscribe();
      }
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    setTracksViewChanges(true);
    setTimeout(() => {
      setTracksViewChanges(false);
    }, 200);
  }, [hinted]);

  return (
    <>
      <Circle
        center={{ latitude: trip.coords.lat, longitude: trip.coords.lon }}
        radius={MARKER_RADIUS - 1}
        strokeColor="blue"
        fillColor="rgba(0,0,0,0)"
        key={`${trip.coords.lat}&${trip.coords.lon}-circle`}
      />
      <Marker
        coordinate={coordinates.current}
        key={`${trip.coords.lat}&${trip.coords.lon}-marker`}
        tracksViewChanges={tracksViewChanges} //android only
      >
        <Image
          source={getMarker(canCheck, hinted)}
          style={{ width: 50, height: 50 }}
          resizeMode="center"
          resizeMethod="resize"
        />

        <Callout style={{ width: 350 }} onPress={() => handleShowPopup(trip)}>
          {/* TODO: Figure out using a CalloutSubview here, or using apple maps instead of google maps for iOS support */}
          <View>
            <Text>
              {trip.name + "  "}
              {canCheck ? (
                <></>
              ) : (
                <FontAwesome5 name="lock" size={15} color="black" />
              )}
            </Text>
            <Text>Press here to show more info</Text>
          </View>
        </Callout>
      </Marker>
    </>
  );
});

export default function APMarkers({
  trips,
  receivedKeys,
  handleShowPopup,
  hintedProgTrips,
}: Readonly<{
  trips: any[] | trip[];
  receivedKeys: number;
  handleShowPopup: (item: trip) => void;
  hintedProgTrips: number[];
}>) {
  const { getSetting } = useContext(SettingsContext);

  const MARKER_RADIUS = getSetting("MARKER_RADIUS", "number");
  const [hintedTrips, setHintedTrips] = useState(hintedProgTrips);
  useEffect(() => {
    setHintedTrips(hintedProgTrips);
  }, [hintedProgTrips]);
  return (
    <>
      {trips.map((t: trip | string) => {
        if (typeof t !== "string") {
          return (
            <MemoizedMarker
              trip={t}
              key={`${t.name}`}
              receivedKeys={receivedKeys}
              handleShowPopup={handleShowPopup}
              MARKER_RADIUS={MARKER_RADIUS}
              hinted={hintedTrips.includes(t.id)}
            />
          );
        }
        return null;
      })}
    </>
  );
}
