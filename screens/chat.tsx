import { Client } from "archipelago.js";
import React, { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

import chatStyles from "../styles/ChatStyles";
import commonStyles from "../styles/CommonStyles";

export default function Chat({
  client,
  messages,
}: Readonly<{
  client: Client;
  messages: string[];
}>) {
  const [chat, setChat] = useState("");
  const sendMessage = () => {
    console.log("sending message", chat);
    client.say(chat);
  };
  return (
    <View style={chatStyles.chat}>
      <View>
        <Text style={commonStyles.inputLabel}>Command:</Text>
        <TextInput
          style={commonStyles.textInput}
          onChangeText={(text) => {
            setChat(text);
          }}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
      {messages.map((message) => {
        return <Text key={message}>{message}</Text>;
      })}
    </View>
  );
}
