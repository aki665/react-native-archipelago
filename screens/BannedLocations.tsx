import MapView, {
  Callout,
  Circle,
  LatLng,
  MapMarker,
  Marker,
} from "react-native-maps";
import mapStyles from "../styles/MapStyles";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Dimensions,
  NativeEventSubscription,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { LocationObject } from "expo-location";
import Popup from "../components/Popup";
import commonStyles from "../styles/CommonStyles";
import Slider from "@react-native-community/slider";
import { CircularSlider } from "@v3ron/react-native-circular-slider";
import Button from "../components/Button";
import Colors from "../styles/Colors";
import { locationInfo } from "../components/LocationInfoPopup";
import { load, save } from "../utils/storageHandler";
import { Settings, SettingsContext } from "../components/SettingsContext";

export async function getBannedLocations() {
  const bannedLocations = await load("__bannedLocations", "object");
  if (bannedLocations != null)
    return bannedLocations as locationInfo["coords"][];
  else return [];
}

export async function banLocation(location: locationInfo["coords"]) {
  const banList = await getBannedLocations();
  banList.push(location);
  await save(banList, "__bannedLocations", "object");
}

export async function removeBannedLocation(location: locationInfo["coords"]) {
  const banList = await getBannedLocations();
  const newList = banList.filter((item) => {
    return item.osmID !== location.osmID;
  });
  await save(newList, "__bannedLocations", "object");
}

async function handleBack(
  homeMarker: LatLng,
  homeMarkerEnabled: boolean,
  minRadian: number,
  maxRadian: number,
  handleSettingChange: (newValue: Settings["value"], name: string) => void,
) {
  handleSettingChange(homeMarkerEnabled, "USE_HOME_LOCATION");
  if (homeMarkerEnabled) handleSettingChange(homeMarker, "HOME_LOCATION");
  handleSettingChange(minRadian, "MIN_RADIAN");
  handleSettingChange(maxRadian, "MAX_RADIAN");
}

function handleRemoveBannedLocation(location: locationInfo["coords"]) {
  Alert.alert(
    "Do you want to remove this location from the list of banned locations?",
    undefined,
    [
      {
        text: "Cancel",
        onPress: () => null,
        style: "cancel",
      },
      {
        text: "Remove",
        onPress: () => {
          removeBannedLocation(location);
        },
      },
    ],
  );
}

function BannedLocationMarker({ l }: Readonly<{ l: locationInfo["coords"] }>) {
  const markerRef = useRef<null | MapMarker>(null);
  return (
    <Marker
      coordinate={{ latitude: l.lat, longitude: l.lon }}
      tracksViewChanges={false}
      ref={markerRef}
    >
      <MaterialCommunityIcons
        color={Colors.playerSelf}
        name="map-marker-remove-variant"
        size={50}
      />
      <Callout
        style={{ width: 350 }}
        onPress={() => {
          handleRemoveBannedLocation(l);
          markerRef.current?.redraw();
        }}
      >
        {/* TODO: Figure out using a CalloutSubview here, or using apple maps instead of google maps for iOS support */}
        <View>
          <Text>{l.osmID}</Text>
          <Text>Press here to remove this location from banned locations</Text>
        </View>
      </Callout>
    </Marker>
  );
}

export default function BannedLocations({
  navigation,
  route,
}: Readonly<{
  navigation: MaterialTopTabBarProps["navigation"];
  route: { params: { location: LocationObject } };
}>) {
  const { getSetting, handleSettingChange } = useContext(SettingsContext);
  const HOME_LOCATION = getSetting("HOME_LOCATION", "object") as LatLng;

  const [visible, setVisible] = useState(false);
  const [smallCircleRadius, setSmallCircleRadius] = useState(500);
  const [smallCircleRadiusString, setSmallCircleRadiusString] = useState("500");
  const [largeCircleRadius, setLargeCircleRadius] = useState(5000);
  const [largeCircleRadiusString, setLargeCircleRadiusString] =
    useState("5000");

  const [maxRadius, setMaxRadius] = useState(
    getSetting("MAX_RADIAN", "number"),
  );
  const [minRadius, setMinRadius] = useState(
    getSetting("MIN_RADIAN", "number"),
  );
  const [showAdjuster, setShowAdjuster] = useState(false);
  const [homeMarkerEnabled, setHomeMarkerEnabled] = useState(
    getSetting("USE_HOME_LOCATION", "boolean"),
  );

  const [homeMarkerLatLng, setHomeMarkerLatLng] = useState<LatLng>({
    latitude: HOME_LOCATION.latitude ?? route.params.location.coords.latitude,
    longitude:
      HOME_LOCATION.longitude ?? route.params.location.coords.longitude,
  });
  const [bannedLocations, setBannedLocations] = useState<
    locationInfo["coords"][]
  >([]);

  const backHandler = useRef<NativeEventSubscription | undefined>(undefined);

  useEffect(() => {
    const loadSettings = async () => {
      const savedBannedLocations = await getBannedLocations();
      console.log("Banned locations:", savedBannedLocations);
      if (savedBannedLocations.length > 0)
        setBannedLocations(savedBannedLocations);
    };
    backHandler.current = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        void handleBack(
          homeMarkerLatLng,
          homeMarkerEnabled,
          minRadius,
          maxRadius,
          handleSettingChange,
        );
        navigation.goBack();
        return true;
      },
    );
    void loadSettings();
  }, []);
  return (
    <SafeAreaView>
      <Popup
        visible={visible}
        closePopup={() => setVisible(false)}
        popupStyle={{ paddingTop: 0 }}
      >
        <View>
          <Button
            onPress={() => setVisible(false)}
            buttonStyle={{
              marginTop: 10,
            }}
            text="Close"
          ></Button>
          <Text
            style={{
              marginTop: 10,
            }}
          >
            Tap and hold on the marker to move your home location. This will be
            used in location generation as the starting point. {"\n\n"}
            Use the button at the top of the screen to set the allowed
            directions for markers to show up.{"\n\n"}
            Use the fields bellow to change the sizes of the circles. Use the
            circles to figure out what you want your yaml settings to be.
          </Text>
          <View
            style={{ borderRadius: 1, elevation: 2, padding: 5, marginTop: 8 }}
          >
            <Text style={{ marginBottom: 3, padding: 10 }}>
              Use home location
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Switch
                trackColor={{ true: "#green" }}
                thumbColor="#f4f3f4"
                value={homeMarkerEnabled}
                onValueChange={(value) => {
                  setHomeMarkerEnabled(value);
                }}
                style={{ margin: 12 }}
              />
            </View>
          </View>
          <View
            style={{ borderRadius: 1, elevation: 2, padding: 5, marginTop: 8 }}
          >
            <Text style={{ marginBottom: 3, padding: 10 }}>
              Minimum distance
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Slider
                style={{ width: "75%" }}
                maximumValue={5000}
                minimumValue={100}
                step={1}
                value={smallCircleRadius}
                onValueChange={(value) => {
                  setSmallCircleRadius(value);
                  setSmallCircleRadiusString(value.toString());
                }}
              />

              <TextInput
                style={{ ...commonStyles.textInput, minWidth: "20%" }}
                value={smallCircleRadiusString}
                inputMode="numeric"
                onChangeText={(text) => setSmallCircleRadiusString(text)}
                onEndEditing={(newText) => {
                  const newValue = parseInt(newText.nativeEvent.text, 10);
                  const min = 100;
                  const max = 5000;
                  if (isNaN(newValue)) {
                    setSmallCircleRadiusString(smallCircleRadius.toString());
                    //don't change the setting if it is not a number
                  } else if (newValue < min) {
                    setSmallCircleRadius(min);
                    setSmallCircleRadiusString(min.toString());
                  } else if (newValue > max) {
                    setSmallCircleRadius(max);
                    setSmallCircleRadiusString(max.toString());
                  } else {
                    setSmallCircleRadius(parseInt(newText.nativeEvent.text));
                  }
                }}
              />
            </View>
          </View>
          <View
            style={{ borderRadius: 1, elevation: 2, padding: 5, marginTop: 8 }}
          >
            <Text style={{ marginBottom: 3, padding: 10 }}>
              Maximum distance
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Slider
                style={{ width: "75%" }}
                maximumValue={50000}
                minimumValue={1000}
                step={1}
                value={largeCircleRadius}
                onValueChange={(value) => {
                  setLargeCircleRadius(value);
                  setLargeCircleRadiusString(value.toString());
                }}
              />

              <TextInput
                style={{ ...commonStyles.textInput, minWidth: "20%" }}
                value={largeCircleRadiusString}
                inputMode="numeric"
                onChangeText={(text) => setLargeCircleRadiusString(text)}
                onEndEditing={(newText) => {
                  const newValue = parseInt(newText.nativeEvent.text, 10);
                  const min = 1000;
                  const max = 50000;
                  if (isNaN(newValue)) {
                    setLargeCircleRadiusString(smallCircleRadius.toString());
                    //don't change the setting if it is not a number
                  } else if (newValue < min) {
                    setLargeCircleRadius(min);
                    setLargeCircleRadiusString(min.toString());
                  } else if (newValue > max) {
                    setLargeCircleRadius(max);
                    setLargeCircleRadiusString(max.toString());
                  } else {
                    setLargeCircleRadius(parseInt(newText.nativeEvent.text));
                  }
                }}
              />
            </View>
          </View>
        </View>
      </Popup>
      <View
        style={{
          height: "5%",
          backgroundColor: "white",
          borderBottomWidth: 2,
          borderBlockColor: "lightgray",
          flexDirection: "row",
        }}
      >
        <AntDesign
          onPress={() => {
            void handleBack(
              homeMarkerLatLng,
              homeMarkerEnabled,
              minRadius,
              maxRadius,
              handleSettingChange,
            );
            navigation.goBack();
          }}
          name="arrowleft"
          size={30}
          color="gray"
          style={{ flex: 1, verticalAlign: "middle" }}
        />

        <Button
          onPress={() => setShowAdjuster((prevState) => !prevState)}
          text="Toggle angle adjuster"
          buttonStyle={{
            marginVertical: 3,
          }}
        />
        <View
          style={{
            flex: 1,
          }}
        />
      </View>
      <Pressable
        style={{
          position: "absolute",
          top: 150,
          right: 12,
          zIndex: 9999,
          backgroundColor: "white",
          padding: 7,
          borderRadius: 1,
          elevation: 10,
          opacity: 0.75,
          borderBlockColor: "lightgray",
        }}
        onPress={() => {
          setVisible(true);
        }}
      >
        <View>
          <AntDesign name="questioncircleo" size={24} color="black" />
        </View>
      </Pressable>
      <MapView
        style={mapStyles.map}
        userLocationUpdateInterval={1000}
        showsUserLocation
        initialRegion={{
          latitude: route.params.location.coords.latitude,
          longitude: route.params.location.coords.longitude,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
      >
        <Circle
          radius={smallCircleRadius}
          center={
            homeMarkerEnabled
              ? homeMarkerLatLng
              : {
                  latitude: route.params.location.coords.latitude,
                  longitude: route.params.location.coords.longitude,
                }
          }
        />
        <Circle
          radius={largeCircleRadius}
          center={
            homeMarkerEnabled
              ? homeMarkerLatLng
              : {
                  latitude: route.params.location.coords.latitude,
                  longitude: route.params.location.coords.longitude,
                }
          }
        />
        {homeMarkerEnabled && (
          <Marker
            coordinate={homeMarkerLatLng}
            draggable
            onDragEnd={(event) =>
              setHomeMarkerLatLng(event.nativeEvent.coordinate)
            }
            tracksViewChanges={false}
          >
            <MaterialCommunityIcons
              color={Colors.playerSelf}
              name="map-marker-account"
              size={50}
            />
          </Marker>
        )}
        {bannedLocations.map((l: locationInfo["coords"]) => {
          return <BannedLocationMarker l={l} key={l.osmID} />;
        })}
      </MapView>
      {showAdjuster && (
        <View
          style={{
            zIndex: 1000,
            position: "absolute",
            left:
              Dimensions.get("window").width / 2 -
              Dimensions.get("window").width / 2.5,
            top:
              Dimensions.get("window").height / 2 -
              Dimensions.get("window").width / 2.5,
          }}
        >
          <CircularSlider
            startAngle={minRadius}
            angleLength={maxRadius}
            onUpdate={({ startAngle, angleLength }) => {
              console.log(startAngle);
              setMaxRadius(angleLength);
              setMinRadius(startAngle);
            }}
            strokeWidth={10}
            radius={Dimensions.get("window").width / 2.5}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
