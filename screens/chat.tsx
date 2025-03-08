import { itemClassifications } from "archipelago.js";
import { ValidJSONColorType } from "archipelago.js/src/api";
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
          itemType?: number;
          color?: ValidJSONColorType;
        },
      ],
    ];

/**
 * Breaks a single message into parts and then renders them with the correct colors. Memoized to improve performance.
 * @returns A text element that has the chat line split into parts and colorized.
 */
const ChatLine = memo(function chatLine({
  message,
  index,
}: {
  message: {
    type: string;
    text: string;
    selfPlayer?: boolean;
    itemType?: number;
    color?: ValidJSONColorType;
  }[];
  index: number;
}) {
  const msgPart = message[0];
  const restOfMessage = message.slice(1);
  let style = chatStyles.message;
  switch (msgPart.type) {
    case "player":
      if (msgPart.selfPlayer) style = { ...style, color: Colors.playerSelf };
      else style = { ...style, color: Colors.playerOther };
      break;
    case "item":
      if (msgPart.itemType === itemClassifications.useful)
        style = { ...style, color: Colors.useful };
      else if (msgPart.itemType === itemClassifications.progression)
        style = { ...style, color: Colors.progression };
      else if (msgPart.itemType === itemClassifications.trap)
        style = { ...style, color: Colors.trap };
      else if (
        msgPart.itemType ===
        itemClassifications.progression + itemClassifications.useful
      )
        style = { ...style, color: Colors.progUseful };
      else if (
        msgPart.itemType ===
        itemClassifications.progression + itemClassifications.trap
      )
        style = { ...style, color: Colors.progTrap };
      else if (
        msgPart.itemType ===
        itemClassifications.useful + itemClassifications.trap
      )
        style = { ...style, color: Colors.usefulTrap };
      else if (
        msgPart.itemType ===
        itemClassifications.useful +
          itemClassifications.trap +
          itemClassifications.progression
      )
        style = { ...style, color: Colors.progUsefulTrap };
      else style = { ...style, color: Colors.filler };
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
});

export default function Chat({
  messages,
  setMessages,
}: Readonly<{
  messages: messages;
  setMessages: React.Dispatch<React.SetStateAction<messages>>;
}>) {
  const [chat, setChat] = useState("");
  const { client } = useContext(ClientContext);
  const chatBoxRef = useRef<ScrollView>(null);

  /**
/help 
    Returns the help listing
/license 
    Returns the licensing information
/exit 
    Close connections and client
/connect [address] 
    Connect to a MultiWorld Server
/disconnect 
    Disconnect from a MultiWorld Server
/received 
    List all received items
/missing [filter_text] 
    List all missing location checks, from your local game state.
        Can be given text, which will be used as filter.
/items 
    List all item names for the currently running game.
/item_groups 
    List all item group names for the currently running game.
/locations 
    List all location names for the currently running game.
/location_groups 
    List all location group names for the currently running game.
/ready 
    Send ready status to server.
 */

  const commands = {
    "/received": {
      command: [
        [
          {
            type: "text",
            text: `${client.items.received.length} received items, sorted by time:`,
          },
        ],
        ...client.items.received.map(
          (
            item,
          ): {
            type: string;
            text: string;
            selfPlayer?: boolean;
            itemType?: number;
            color?: ValidJSONColorType;
          }[] => {
            return [
              {
                type: "item",
                text: item.name,
                itemType: item.flags,
              },
              { type: "text", text: " from " },
              { type: "location", text: item.locationName },
              { type: "text", text: " by " },
              {
                type: "player",
                text: item.sender.alias,
                selfPlayer: item.sender.slot === item.receiver.slot,
              },
            ];
          },
        ),
      ],
      description: "List all received items",
    },
    "/help": {
      command: undefined,
      description: "Returns the help listing",
    },
  };

  const getCommands = () => {
    return Object.entries(commands).map(([key, command]) => {
      return [{ type: "text", text: key + "\n" + command.description }];
    });
  };

  const sendMessage = () => {
    console.log("handling message", chat);
    if (chat.startsWith("/")) {
      if (chat === "/help") {
        const commandDescriptions = getCommands();
        console.log(commandDescriptions);
        setMessages((prevState) => [...prevState, ...commandDescriptions]);
      } else {
        const res = commands[chat]?.command;
        console.log(res);
        if (res === undefined) {
          setMessages((prevState) => [
            ...prevState,
            [
              {
                text: "Command not found",
                type: "color",
                color: "red",
              },
            ],
          ]);
          setChat("");
          return;
        }
        setMessages((prevState) => [...prevState, ...res]);
      }
      setChat("");
      return;
    }
    try {
      if (chat !== "") void client.messages.say(chat);
    } catch (e) {
      console.log(e);
    }
    setChat("");
  };
  return (
    <View style={chatStyles.chat}>
      <ScrollView
        ref={chatBoxRef}
        onContentSizeChange={(contentWidth, contentHeight) => {
          chatBoxRef?.current?.scrollToEnd({ animated: false });
        }}
        nestedScrollEnabled
      >
        {messages.map((message, index) => (
          <>
            {index !== 0 && (
              <View
                style={{
                  borderBottomWidth: 0.3,
                }}
                key={`message-${index}-border`}
              ></View>
            )}
            <ChatLine
              message={message}
              index={index}
              key={`message-${index}`}
            />
          </>
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
