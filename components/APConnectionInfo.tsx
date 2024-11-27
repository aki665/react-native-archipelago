import React, { useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";

import Button from "./Button";
import commonStyles from "../styles/CommonStyles";

export type apInfo = {
  hostname: string;
  port: number;
  name: string;
  password?: string;
};

/**
 * Renders AP information inputs
 * @param onPress a method that is run when the included button is pressed
 * @param buttonText What the button says on it
 * @param loading State that when it is true, the fields and button are disabled
 * @param savedInfo default values for the fields
 */
export default function APConnectionInfo({
  onPress,
  buttonText,
  loading,
  savedInfo,
}: Readonly<{
  onPress: (apInfo: apInfo) => void;
  buttonText: string;
  loading: boolean;
  savedInfo?: apInfo;
}>) {
  const [apInfo, setApInfo] = useState<apInfo>(
    savedInfo || {
      hostname: "archipelago.gg",
      port: 0,
      name: "",
      password: undefined,
    },
  );
  const [portString, setPortString] = useState(
    savedInfo?.port.toString() ?? "",
  );
  return (
    <>
      <View>
        <Text style={commonStyles.inputLabel}>Address</Text>
        <TextInput
          style={commonStyles.textInput}
          onChangeText={(text) => {
            setApInfo({ ...apInfo, hostname: text });
          }}
          value={apInfo.hostname}
          editable={!loading}
          placeholder="Address"
        />
      </View>
      <View>
        <Text style={commonStyles.inputLabel}>Port</Text>
        <TextInput
          style={commonStyles.textInput}
          keyboardType="number-pad"
          onChangeText={(text) => {
            setPortString(text);
            setApInfo({ ...apInfo, port: parseInt(text, 10) || 0 });
          }}
          value={portString}
          editable={!loading}
          placeholder="Port"
        />
      </View>
      <View>
        <Text style={commonStyles.inputLabel}>Name</Text>
        <TextInput
          style={commonStyles.textInput}
          onChangeText={(text) => {
            setApInfo({ ...apInfo, name: text });
          }}
          value={apInfo.name}
          editable={!loading}
          placeholder="Name"
        />
      </View>
      <View>
        <Text style={commonStyles.inputLabel}>Password</Text>
        <TextInput
          style={commonStyles.textInput}
          onChangeText={(text) => {
            setApInfo({ ...apInfo, password: text || undefined });
          }}
          value={apInfo.password}
          editable={!loading}
          placeholder="Password"
        />
      </View>
      <Button
        text={buttonText}
        textStyle={{ fontSize: 16 }}
        onPress={() => {
          onPress(apInfo);
        }}
        buttonProps={{ disabled: loading }}
        removeText={loading}
      >
        {loading && <ActivityIndicator size="large" color="white" />}
      </Button>
    </>
  );
}
