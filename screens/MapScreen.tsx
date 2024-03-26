import * as Location from "expo-location";
import React, { PropsWithChildren, memo, useEffect, useState } from "react";
import { Image, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import mapStyles from "../styles/MapStyles";

function APMarker({
  latitude,
  longitude,
}: Readonly<{
  latitude: number;
  longitude: number;
}>) {
  return (
    <Marker coordinate={{ latitude, longitude }}>
      <Image
        source={require("../assets/color-icon.png")}
        style={{ width: 26, height: 28 }}
        resizeMode="center"
        resizeMethod="resize"
      />
    </Marker>
  );
}
const MemoizedMap = memo(function MemoizedMap(props: PropsWithChildren) {
  return (
    <MapView provider={PROVIDER_GOOGLE} style={mapStyles.map} showsUserLocation>
      {props.children}
    </MapView>
  );
});

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      console.log(location);
      setLocation(location);
    };
    getLocation();
    const locationTimeOut = setInterval(getLocation, 10000);
    return () => {
      clearInterval(locationTimeOut);
    };
  }, []);
  return (
    <View style={mapStyles.container}>
      <MemoizedMap>
        <APMarker latitude={37.78825} longitude={-122.4324} />
      </MemoizedMap>
    </View>
  );
}
