import { Client, Hint } from "archipelago.js";
import React, { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import * as Location from "expo-location";

import Button from "./Button";
import Popup from "./Popup";
import { trip } from "../screens/MapScreen";
import { MAP_ID_TO_ITEM } from "../utils/handleItems";
import { SettingsContext } from "./SettingsContext";
import { getDistanceFromLatLonInKm } from "../utils/getLocations";
import { banLocation } from "../screens/BannedLocations";

/**Time between location rerolls in seconds */
export const REROLL_TIME = 120;

export type locationInfo = {
  coords: {
    lat: number;
    lon: number;
    osmID: string;
  };
  keysNeeded: number;
  name: string;
  id: number;
};

type locationHintInfo = {
  receivingPlayer: string;
  item: string;
};

type keyHintInfo = {
  sendingPlayer: string;
  location: string;
  found: boolean;
  item: string;
};

export default function LocationInfoPopup({
  visible,
  closePopup,
  location,
  client,
  receivedKeys,
  rerollSelectedLocation,
  rerollAllowed,
  rerollTime,
  setLocationAsFound,
}: Readonly<{
  visible: boolean;
  closePopup: () => void;
  location: trip | null;
  client: Client;
  receivedKeys: number;
  rerollSelectedLocation: (id: number, name: string) => Promise<void>;
  rerollAllowed: React.MutableRefObject<boolean>;
  rerollTime: React.MutableRefObject<Date>;
  setLocationAsFound: (id: number) => void;
}>) {
  const [locationInfo, setLocationInfo] = useState<locationInfo | null>(null);
  const [locationHint, setLocationHint] = useState<locationHintInfo | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [canHint, setCanHint] = useState<boolean>(false);
  const [hintedKeys, setHintedKeys] = useState<keyHintInfo[] | []>([]);
  const { getSetting } = useContext(SettingsContext);
  const alwaysBan = getSetting("ALWAYS_BAN_REROLL_LOCATION", "boolean");

  const handleBan = (location: locationInfo["coords"]) => {
    if (alwaysBan) void banLocation(location);
    else {
      Alert.alert(
        "Do you want to add this location to add this location to banned locations?",
        undefined,
        [
          {
            text: "No",
          },
          {
            text: "Yes",
            onPress: () => {
              void banLocation(location);
            },
          },
        ],
      );
    }
  };

  const handleReroll = () => {
    if (
      locationInfo !== null &&
      (locationInfo.coords.osmID === "0" ||
        (locationInfo.coords.lat === 0 && locationInfo.coords.lon === 0))
    ) {
      Alert.alert(
        "Do you want to reroll this location?",
        "This location seems to be invalid. Reroll will not be on cooldown.",
        [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel",
          },
          {
            text: "Reroll",
            onPress: () => {
              rerollSelectedLocation(locationInfo?.id, locationInfo.name);
              rerollAllowed.current = true;
              handleClosePopup();
            },
          },
        ],
      );
    } else if (locationInfo !== null && rerollAllowed.current) {
      Alert.alert(
        "Do you want to reroll this location?",
        `Do you want to reroll the existing one with a new one?\nYou will be unable to reroll locations for the next ${REROLL_TIME} seconds` +
          (alwaysBan
            ? "\n\nThe location will also be added to the banned locations list."
            : ""),
        [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel",
          },
          {
            text: "Reroll",
            onPress: () => {
              handleBan(locationInfo.coords);
              rerollSelectedLocation(locationInfo?.id, locationInfo.name);
              handleClosePopup();
            },
          },
        ],
      );
    }
  };

  const handleClosePopup = () => {
    setLocationInfo(null);
    setLocationHint(null);
    closePopup();
  };

  const handleHintMessage = async () => {
    const hints = client.socket.connected
      ? await client.players.self.fetchHints()
      : client.items.hints;
    const locationHint = hints.find((hint) => {
      return (
        hint.item.locationId === location?.id &&
        hint.item.receiver === client.players.self
      );
    });

    const keyHint = hints.filter(
      (hint) =>
        hint.item.id === MAP_ID_TO_ITEM.KEY &&
        hint.item.receiver === client.players.self,
    );

    handleKeyHints(keyHint);
    handleLocationHint(locationHint);

    if (client.socket.connected)
      setCanHint(client.room.hintPoints >= client.room.hintCost);
    else {
      setCanHint(false);
    }
    setLoading(false);
  };

  const handleLocationHint = (hint: Hint | undefined) => {
    if (hint === undefined) setLocationHint(null);
    else {
      const receivingPlayer = hint.item.receiver.alias;
      const item = hint.item.name;
      setLocationHint({ receivingPlayer, item });
    }
  };

  const handleKeyHints = (hints: Hint[]) => {
    if (hints.length === 0) setLocationHint(null);
    else {
      const formattedHints = hints.map((hint) => {
        return {
          sendingPlayer: hint.item.sender.alias,
          location: hint.item.locationName,
          found: hint.found,
          item: hint.item.toString(),
        };
      });
      setHintedKeys(formattedHints);
    }
  };

  const handleHintLocation = () => {
    setLoading(true);
    client.messages.say(`!hint_location ${locationInfo?.name}`);
    setLoading(false);
  };

  const handleHintKey = () => {
    setLoading(true);
    client.messages.say(`!hint Progressive Key`);
    setLoading(false);
  };

  const handleCheckLocation = async () => {
    if (locationInfo !== null) {
      const CAN_ALWAYS_SEND_LOCATION = getSetting(
        "CAN_ALWAYS_SEND_LOCATION",
        "boolean",
      );
      if (CAN_ALWAYS_SEND_LOCATION) {
        Alert.alert("Do you want send this location?", undefined, [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel",
          },
          {
            text: "Send",
            onPress: () => {
              setLocationAsFound(locationInfo.id);
              handleClosePopup();
            },
          },
        ]);
      } else {
        const MARKER_RADIUS = getSetting("MARKER_RADIUS", "number");
        const currentLocation = await Location.getCurrentPositionAsync();
        const distanceFromLocation =
          getDistanceFromLatLonInKm(
            locationInfo.coords.lat,
            locationInfo.coords.lon,
            currentLocation.coords.latitude,
            currentLocation.coords.longitude,
          ) * 1000;
        console.log(distanceFromLocation, " < ", MARKER_RADIUS);
        if (distanceFromLocation < MARKER_RADIUS) {
          setLocationAsFound(locationInfo.id);
          handleClosePopup();
        } else
          Alert.alert(
            "",
            `Could not send location. You are not within ${MARKER_RADIUS}m of the location.\nDistance to location: ${Math.ceil(distanceFromLocation)}m`,
          );
      }
    }
  };

  useEffect(() => {
    if (location !== null) {
      client.items.on("hintReceived", handleHintMessage);
      setLoading(true);
      setLocationInfo({
        coords: location.coords,
        keysNeeded: location.trip.key_needed,
        name: location.name,
        id: location.id,
      });
      console.log(receivedKeys, location.trip.key_needed);
      handleHintMessage();
      setLoading(false);
    } else {
      client.items.off("hintReceived", handleHintMessage);
    }
  }, [location]);
  return (
    <Popup
      visible={visible}
      closePopup={handleClosePopup}
      popupStyle={{ paddingTop: 0 }}
    >
      {(!locationInfo || loading) && <ActivityIndicator />}
      {locationInfo && (
        <View
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "row",
            width: "100%",
            marginTop: 10,
          }}
        >
          <View>
            {rerollAllowed.current && (
              <Button
                onPress={handleReroll}
                text="Reroll"
                textStyle={{ fontSize: 10 }}
                buttonStyle={{ paddingVertical: 2, paddingHorizontal: 4 }}
              />
            )}
            {!rerollAllowed.current && (
              <Text
                style={{
                  fontSize: 10,
                  maxWidth: "70%",
                  color: "gray",
                }}
              >
                Next reroll available in about{" "}
                {Math.ceil(
                  REROLL_TIME +
                    (rerollTime.current.getTime() - new Date().getTime()) /
                      1000,
                )}{" "}
                second(s)
              </Text>
            )}
          </View>
          <Pressable>
            <Text
              style={{ fontSize: 12, color: "gray", textAlign: "right" }}
              selectable
            >
              osm ID:{locationInfo.coords.osmID}
            </Text>
          </Pressable>
        </View>
      )}
      <Button
        onPress={handleClosePopup}
        text="Close"
        buttonStyle={{ marginBottom: 10 }}
      />
      {locationInfo && (
        <View>
          <View
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text>{locationInfo.name}</Text>
          </View>
          {locationHint && (
            <Text style={{ marginBottom: 10 }}>
              {locationHint.receivingPlayer}'s {locationHint.item} can be found
              here.
            </Text>
          )}
          {!locationHint && (
            <>
              <Text style={{ marginBottom: 10 }}>
                {canHint && "This location can be hinted. "}A hint requires{" "}
                {client.room.hintCost} hint points. You currently have{" "}
                {client.room.hintPoints}.
              </Text>
              {canHint ? (
                <Button
                  onPress={() => handleHintLocation()}
                  text="Hint location"
                  buttonStyle={{ marginBottom: 10 }}
                  buttonProps={{
                    disabled: !canHint || loading,
                  }}
                />
              ) : (
                <Text style={{ marginBottom: 10, color: "gray" }}>
                  {client.socket.connected
                    ? "You do not have enough hint points to hint this location"
                    : "You are not currently connected"}
                </Text>
              )}
            </>
          )}
          {locationInfo.keysNeeded > 0 && (
            <>
              <Text style={{ marginBottom: 10 }}>
                This location requires {locationInfo.keysNeeded} keys, and you
                currently have {receivedKeys}
              </Text>
              {locationInfo.keysNeeded > receivedKeys &&
                hintedKeys.length < locationInfo.keysNeeded && (
                  <>
                    {canHint ? (
                      <Button
                        onPress={() => handleHintKey()}
                        text="Hint Key"
                        buttonStyle={{ marginBottom: 10 }}
                        buttonProps={{
                          disabled: loading,
                        }}
                      />
                    ) : (
                      <Text style={{ marginBottom: 10, color: "gray" }}>
                        {client.socket.connected
                          ? "You do not have enough hint points to hint a key"
                          : "You are not currently connected"}
                      </Text>
                    )}
                  </>
                )}
              {locationInfo.keysNeeded > receivedKeys && (
                <>
                  {hintedKeys.map((hint) => (
                    <Text
                      key={hint.location}
                      style={{
                        marginBottom: 10,
                        fontSize: 12,
                        color: hint.found ? "darkgreen" : "darkred",
                      }}
                    >
                      {client.players.self.alias}'s {hint.item} is at{" "}
                      {hint.location} in {hint.sendingPlayer}'s World
                      {" (" + (hint.found ? "found" : "not found") + ")"}
                    </Text>
                  ))}
                </>
              )}
            </>
          )}
          {(getSetting("CAN_ALWAYS_SEND_LOCATION", "boolean") ||
            receivedKeys >= locationInfo.keysNeeded) && (
            <Button
              onPress={() => handleCheckLocation()}
              text="Check location"
              buttonStyle={{ marginBottom: 10 }}
            ></Button>
          )}
        </View>
      )}
    </Popup>
  );
}
