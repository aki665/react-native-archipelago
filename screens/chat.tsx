import { Client } from "archipelago.js";
import React from "react";
import { Text, View } from "react-native";

export default function Chat({
  messages,
  client,
}: Readonly<{
  messages: string[];
  client: Client;
}>) {
  console.log(client);
  return (
    <View>
      {messages.map((message) => {
        return <Text key={message}>{message}</Text>;
      })}
    </View>
  );
}
