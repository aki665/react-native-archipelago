import { Client, Hint } from "archipelago.js";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import Button from "./Button";
import Popup from "./Popup";
import { trip } from "../screens/MapScreen";

type locationInfo = {
  coords: {
    lat: number;
    lon: number;
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
}: Readonly<{
  visible: boolean;
  closePopup: () => void;
  location: trip | null;
  client: Client;
  receivedKeys: number;
}>) {
  const [locationInfo, setLocationInfo] = useState<locationInfo | null>(null);
  const [hint, setHint] = useState<hintInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [canHint, setCanHint] = useState<boolean>(false);

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
    <Popup visible={visible} closePopup={handleClosePopup}>
      <Button
        onPress={handleClosePopup}
        text="Close"
        buttonStyle={{ marginBottom: 10 }}
      />
      {locationInfo && (
        <View>
          <Text style={{ marginBottom: 10 }}>{locationInfo.name}</Text>
          {hint && (
            <Text style={{ marginBottom: 10 }}>
              {hint.receivingPlayer}'s {hint.item} can be found here.
            </Text>
          )}
          {!hint && (
            <>
              <Text style={{ marginBottom: 10 }}>
                This location can be hinted. A hint requires{" "}
                {client.data.hintCost} hint points. You currently have{" "}
                {client.data.hintPoints}.
              </Text>
              <Button
                onPress={() => handleHintLocation()}
                text="Hint location"
                buttonStyle={{ marginBottom: 10 }}
                buttonProps={{
                  disabled: !canHint || loading,
                }}
              />
            </>
          )}
          {locationInfo.keysNeeded > 0 && (
            <>
              <Text style={{ marginBottom: 10 }}>
                This location requires {locationInfo.keysNeeded} keys, and you
                currently have {receivedKeys}
              </Text>
              {locationInfo.keysNeeded > receivedKeys && (
                <Button
                  onPress={() => handleHintKey()}
                  text="Hint Key"
                  buttonProps={{
                    disabled: !canHint || loading,
                  }}
                />
              )}
            </>
          )}
        </View>
      )}
      {(!locationInfo || loading) && <ActivityIndicator />}
    </Popup>
  );
}
