import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import React, { memo, useEffect, useRef, useState } from "react";
import { Image, Text, View } from "react-native";
import { Callout, Circle, Marker } from "react-native-maps";

import { trip } from "./MapScreen";

const MemoizedMarker = memo(function APMarker({
  trip,
  receivedKeys,
  handleShowPopup,
}: Readonly<{
  trip: trip;
  receivedKeys: number;
  handleShowPopup: (item: trip) => void;
}>) {
  const navigation = useNavigation();
  const canCheck = receivedKeys >= trip.trip.key_needed;
  const firstRenderDone = useRef(false);
  console.log(`${receivedKeys}>=${trip.trip.key_needed}=${canCheck}`);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  useEffect(() => {
    setTracksViewChanges(true);
    setTimeout(() => {
      setTracksViewChanges(false);
    }, 200);
  }, [receivedKeys]);
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
        tracksViewChanges={tracksViewChanges} //android only
      >
        <Image
          source={
            canCheck
              ? require("../assets/APMarker_blue.png")
              : require("../assets/APMarker_gray.png")
          }
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
}: Readonly<{
  trips: any[] | trip[];
  receivedKeys: number;
  handleShowPopup: (item: trip) => void;
}>) {
  return (
    <>
      {trips.map((trip: trip) => {
        return (
          <MemoizedMarker
            trip={trip}
            key={`${trip.name}`}
            receivedKeys={receivedKeys}
            handleShowPopup={handleShowPopup}
          />
        );
      })}
    </>
  );
}
