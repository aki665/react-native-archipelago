import { Client } from "archipelago.js";
import React, { useRef, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import Button from "../components/Button";
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
  const chatBoxRef = useRef<ScrollView>(null);
  const sendMessage = () => {
    console.log("sending message", chat);
    if (chat !== "") client.say(chat);
    setChat("");
  };
  return (
    <View style={chatStyles.chat}>
      <ScrollView
        ref={chatBoxRef}
        onContentSizeChange={(contentWidth, contentHeight) => {
          chatBoxRef?.current?.scrollToEnd({ animated: false });
        }}
      >
        {messages.map((message) => {
          return <Text key={message}>{message}</Text>;
        })}
      </ScrollView>
      <View style={chatStyles.chatInputBox}>
        <TextInput
          style={{ ...commonStyles.textInput, flex: 3 }}
          onChangeText={(text) => {
            setChat(text);
          }}
          value={chat}
          onSubmitEditing={() => sendMessage()}
          placeholder="Message"
        />
        <Button onPress={sendMessage} text="Send" />
        {/*<Button
          title="Send"
          style={chatStyles.chatButton}
          onPress={sendMessage}
        />*/}
      </View>
    </View>
  );
}
