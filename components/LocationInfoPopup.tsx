import { Client, Hint } from "archipelago.js";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import Button from "./Button";
import Popup from "./Popup";
import { trip } from "../screens/MapScreen";

/**Time between location rerolls in seconds */
export const REROLL_TIME = 10;

type locationInfo = {
  coords: {
    lat: number;
    lon: number;
    osmID: number;
  };
  keysNeeded: number;
  name: string;
  id: number;
};

type hintInfo = {
  receivingPlayer: string;
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
}: Readonly<{
  visible: boolean;
  closePopup: () => void;
  location: trip | null;
  client: Client;
  receivedKeys: number;
  rerollSelectedLocation: (id: number, name: string) => Promise<void>;
  rerollAllowed: React.MutableRefObject<boolean>;
}>) {
  const [locationInfo, setLocationInfo] = useState<locationInfo | null>(null);
  const [hint, setHint] = useState<hintInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [canHint, setCanHint] = useState<boolean>(false);

  const handleReroll = () => {
    if (locationInfo !== null && rerollAllowed.current) {
      Alert.alert(
        "Do you want to reroll this location?",
        `Do you want to reroll the existing one with a new one?\nYou will be unable to reroll locations for the next ${REROLL_TIME} seconds`,
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
              handleClosePopup();
            },
          },
        ],
      );
    }
  };

  const handleClosePopup = () => {
    setLocationInfo(null);
    setHint(null);
    closePopup();
  };

  const handleHint = (hint: Hint | undefined) => {
    if (hint === undefined) setHint(null);
    else {
      const receivingPlayer = client.players.alias(hint.receiving_player);
      const item = client.items.name(hint.receiving_player, hint.item);
      setHint({ receivingPlayer, item });
    }
  };

  const handleHintLocation = () => {
    setLoading(true);
    client.say(`!hint_location ${locationInfo?.name}`);
    const hint = client.hints.mine.find(
      (hint) => hint.location === locationInfo?.id,
    );
    handleHint(hint);
    setLoading(false);
  };

  const handleHintKey = () => {
    setLoading(true);
    client.say(`!hint Progressive Key`);
    setCanHint(client.data.hintPoints > client.data.hintCost);
    setLoading(false);
  };

  useEffect(() => {
    if (location !== null) {
      setLoading(true);
      const hint = client.hints.mine.find(
        (hint) => hint.location === location.id,
      );
      handleHint(hint);
      setCanHint(client.data.hintPoints > client.data.hintCost);
      setLocationInfo({
        coords: location.coords,
        keysNeeded: location.trip.key_needed,
        name: location.name,
        id: location.id,
      });
      setLoading(false);
    }
  }, [location]);
  return (
    <Popup
      visible={visible}
      closePopup={handleClosePopup}
      popupStyle={{ paddingTop: 0 }}
    >
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
          <Button
            onPress={handleReroll}
            text="Reroll"
            textStyle={{ fontSize: 10 }}
            buttonStyle={{ paddingVertical: 2, paddingHorizontal: 4 }}
          />
          <Pressable>
            <Text style={{ fontSize: 12, color: "gray", textAlign: "right" }}>
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
          {hint && (
            <Text style={{ marginBottom: 10 }}>
              {hint.receivingPlayer}'s {hint.item} can be found here.
            </Text>
          )}
          {!hint && (
            <>
              <Text style={{ marginBottom: 10 }}>
                {canHint && "This location can be hinted. "}A hint requires{" "}
                {client.data.hintCost} hint points. You currently have{" "}
                {client.data.hintPoints}.
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
                  You do not have enough hint points to hint this location
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
              {locationInfo.keysNeeded > receivedKeys && (
                <>
                  {canHint ? (
                    <Button
                      onPress={() => handleHintKey()}
                      text="Hint Key"
                      buttonProps={{
                        disabled: !canHint || loading,
                      }}
                    />
                  ) : (
                    <Text style={{ color: "gray" }}>
                      You do not have enough hint points to hint a key
                    </Text>
                  )}
                </>
              )}
            </>
          )}
        </View>
      )}
      {(!locationInfo || loading) && <ActivityIndicator />}
    </Popup>
  );
}
