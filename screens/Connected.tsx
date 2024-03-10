import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Client, PrintJSONPacket, SERVER_PACKET_TYPE } from "archipelago.js";
import React, { useEffect, useState } from "react";

import Chat from "./chat";

const Tab = createMaterialTopTabNavigator();

function placeholder() {
  return <></>;
}

/**
 * Handler for ap messaging
 * @param packet Packet recieved from archipelago
 * @param message message string
 */

export default function Connected({
  route,
}: Readonly<{
  route: { params: { client: Client; messages: string[] } };
}>) {
  const { client } = route.params;
  const [messages, setMessages] = useState<string[]>([]);

  const handleMessages = (packet: PrintJSONPacket, message: string) => {
    const msg = packet.data[0].text;
    if (packet.type === "ItemSend" || packet.type === "ItemCheat") {
      //Handle items here
    }
    console.log("revieved message", msg);
    setMessages((prevState) => [...prevState, msg]);
  };
  useEffect(() => {
    client.addListener(SERVER_PACKET_TYPE.CONNECTED, (packet) => {
      //setConnection(packet.cmd);
    });
    client.addListener(SERVER_PACKET_TYPE.CONNECTION_REFUSED, (packet) => {
      //setConnection(packet.cmd);
    });
    client.addListener(SERVER_PACKET_TYPE.PRINT_JSON, (packet, message) => {
      console.log("starting message listener...");
      handleMessages(packet, message);
      // Add any additional logic here.
    });
    return () => {
      client.removeListener(
        SERVER_PACKET_TYPE.PRINT_JSON,
        (packet, message) => {
          console.log("starting message listener...");
          handleMessages(packet, message);
        },
      );
    };
  }, []);

  return (
    <Tab.Navigator initialRouteName="chat">
      <Tab.Screen name="chat">
        {(props) => <Chat {...props} client={client} messages={messages} />}
      </Tab.Screen>
      <Tab.Screen name="nothing yet" component={placeholder} />
    </Tab.Navigator>
  );
}
