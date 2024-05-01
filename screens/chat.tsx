import { ITEM_FLAGS, ItemFlags, ValidJSONColorType } from "archipelago.js";
import React, { memo, useContext, useRef, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import Button from "../components/Button";
import { ClientContext } from "../components/ClientContext";
import chatStyles from "../styles/ChatStyles";
import Colors from "../styles/Colors";
import commonStyles from "../styles/CommonStyles";

export type messages =
  | any[]
  | [
      [
        {
          type: string;
          text: string;
          selfPlayer?: boolean;
          itemType?: ItemFlags;
          color?: ValidJSONColorType;
        },
      ],
    ];

/**
 * Breaks a single message into parts and then renders them with the correct colors. Memoized to improve performance.
 * @returns A text element that has the chat line split into parts and colorized.
 */
const ChatLine = memo(
  ({
    message,
    index,
  }: {
    message: {
      type: string;
      text: string;
      selfPlayer?: boolean;
      itemType?: ItemFlags;
      color?: ValidJSONColorType;
    }[];
    index: number;
  }) => {
    const msgPart = message[0];
    const restOfMessage = message.slice(1);
    let style = chatStyles.message;
    switch (msgPart.type) {
      case "player":
        if (msgPart.selfPlayer) style = { ...style, color: Colors.magenta };
        else style = { ...style, color: Colors.yellow };
        break;
      case "item":
        if (msgPart.itemType === ITEM_FLAGS.FILLER)
          style = { ...style, color: Colors.cyan };
        else if (msgPart.itemType === ITEM_FLAGS.NEVER_EXCLUDE)
          style = { ...style, color: Colors.slateblue };
        else if (msgPart.itemType === ITEM_FLAGS.PROGRESSION)
          style = { ...style, color: Colors.plum };
        else if (msgPart.itemType === ITEM_FLAGS.TRAP)
          style = { ...style, color: Colors.salmon };
        break;
      case "location":
        style = { ...style, color: Colors.green };
        break;
      case "color":
        style = { ...style, color: msgPart.color ? msgPart.color : "black" };
        break;
      default:
        break;
    }
    return (
      <Text style={style} key={`${index}-${msgPart.type}`}>
        {msgPart.text}
        {restOfMessage.length > 0 && (
          <ChatLine message={restOfMessage} index={index} />
        )}
      </Text>
    );
  },
);

export default function Chat({
  messages,
}: Readonly<{
  messages: messages;
}>) {
  const [chat, setChat] = useState("");
  const client = useContext(ClientContext);
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
        {messages.map((message, index) => (
          <ChatLine message={message} index={index} key={`message-${index}`} />
        ))}
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
