import React, { useContext, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Table } from "@coligo/react-native-table";
import { ClientContext } from "../components/ClientContext";
import { Hint, NetworkHint } from "archipelago.js";
import Colors from "../styles/Colors";

type hintListItem = {
  receivingPlayer: string;
  item: string;
  classification: { progression: boolean; useful: boolean; trap: boolean };
  findingPlayer: string;
  location: string;
  entrance: string;
  status: number;
};

const transformHintsToListItem = (
  hints: Hint | Hint[],
): hintListItem | hintListItem[] => {
  if (Array.isArray(hints)) {
    return hints.map((hint) => {
      return {
        receivingPlayer: hint.item.receiver.alias,
        item: hint.item.toString(),
        classification: {
          progression: hint.item.progression,
          useful: hint.item.useful,
          trap: hint.item.trap,
        },
        findingPlayer: hint.item.sender.alias,
        location: hint.item.locationName,
        entrance: hint.entrance,
        status: hint.found ? 1 : 0,
      };
    });
  } else {
    return {
      receivingPlayer: hints.item.receiver.alias,
      item: hints.item.toString(),
      classification: {
        progression: hints.item.progression,
        useful: hints.item.useful,
        trap: hints.item.trap,
      },
      findingPlayer: hints.item.sender.alias,
      location: hints.item.locationName,
      entrance: hints.entrance,
      status: hints.found ? 1 : 0,
    };
  }
};

export default function HintsScreen() {
  const { client } = useContext(ClientContext);
  const [data, setData] = useState<hintListItem[]>(
    transformHintsToListItem(client.items.hints) as hintListItem[],
  );

  const handleHintReceived = (hint: Hint) => {
    const newHint = transformHintsToListItem(hint) as hintListItem;
    setData((prevState) => [...new Set([...prevState, newHint])]);
  };

  const handleLocationsChecked = async () => {
    console.log("handleLocationsChecked");
    const newHints = await client.players.self.fetchHints();
    const hintsTest = await client.storage.fetch<NetworkHint[]>(
      `_read_hints_${client.players.self.team}_${client.players.self.slot}`,
    );

    console.log(newHints.filter((hint) => hint.found).length);
    console.log(client.items.hints.filter((hint) => hint.found).length);
    console.log(hintsTest.filter((hint) => hint.found).length);

    setData(transformHintsToListItem(newHints) as hintListItem[]);
  };

  useEffect(() => {
    client.items.on("hintReceived", handleHintReceived);
    client.items.on("hintFound", handleHintReceived);
    client.room.on("locationsChecked", handleLocationsChecked);
    client.items.on("itemsReceived", handleLocationsChecked);
    return () => {
      client.items.off("hintReceived", handleHintReceived);
      client.items.off("hintFound", handleHintReceived);
      client.room.off("locationsChecked", handleLocationsChecked);
      client.items.off("itemsReceived", handleLocationsChecked);
    };
  }, []);

  const columns = [
    {
      label: "Receiver",
      key: "receivingPlayer",
      render: (playerName: string) => (
        <Text
          style={{
            color:
              client.players.self.alias === playerName
                ? Colors.playerSelf
                : Colors.playerOther,
          }}
        >
          {playerName}
        </Text>
      ),
      sortable: true,
    },
    {
      label: "Item",
      key: "item",
      render: (item: string, row: hintListItem) => {
        let color = Colors.filler;
        if (
          row.classification.progression &&
          row.classification.useful &&
          row.classification.trap
        )
          color = Colors.progUsefulTrap;
        else if (row.classification.progression && row.classification.useful)
          color = Colors.progUseful;
        else if (row.classification.useful && row.classification.trap)
          color = Colors.usefulTrap;
        else if (row.classification.progression && row.classification.trap)
          color = Colors.progTrap;
        else if (row.classification.progression) color = Colors.progression;
        else if (row.classification.useful) color = Colors.useful;
        else if (row.classification.trap) color = Colors.trap;
        return <Text style={{ color: color }}>{item}</Text>;
      },
      sortable: true,
    },
    {
      label: "Finder",
      key: "findingPlayer",
      render: (playerName: string) => (
        <Text
          style={{
            color:
              client.players.self.alias === playerName
                ? Colors.playerSelf
                : Colors.playerOther,
          }}
        >
          {playerName}
        </Text>
      ),
      sortable: true,
    },
    {
      label: "Location",
      key: "location",
      render: (location: string) => (
        <Text style={{ color: "green" }}>{location}</Text>
      ),
      sortable: true,
    },
    {
      label: "Entrance",
      key: "entrance",
      render: (entrance: string) => <Text>{entrance}</Text>,
      sortable: true,
    },
    {
      label: "Status",
      key: "status",
      render: (status: boolean) => (
        <Text style={{ color: status ? "darkgreen" : "darkred" }}>
          {status ? "Found" : "Not Found"}
        </Text>
      ),
      sortable: true,
    },
  ];

  return (
    <>
      <Text style={{ color: "gray" }}>
        Note: The status of hints does not update while connected
      </Text>
      <Table
        data={data}
        columns={columns}
        keyExtractor="location"
        sortingIcons={{
          asc: <Text>↑</Text>,
          desc: <Text>↓</Text>,
        }}
        borderStyle={{
          showVertical: true,
          showHorizontalBody: true,
          showHorizontalHeader: true,
          borderWidth: 1,
          borderColor: "#ccc",
        }}
        cellPadding={{
          paddingHorizontal: 5,
          paddingVertical: 5,
        }}
        style={{ marginTop: 5, height: "97%" }}
        estimatedItemSize={100}
        stickyHeader
      />
    </>
  );
}
