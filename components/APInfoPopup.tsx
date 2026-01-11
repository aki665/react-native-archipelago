import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Button from "./Button";
import Popup from "./Popup";
import {
  GOAL_MAP,
  longMacguffinString,
  shortMacguffinString,
} from "../utils/handleItems";
import Colors from "../styles/Colors";

function MacguffinHuntTracker({
  goalString,
  isLongHunt,
}: Readonly<{
  goalString: string;
  isLongHunt: boolean;
}>) {
  return (
    <View style={styles.item}>
      <Text>
        <Text
          style={
            goalString.includes("A")
              ? styles.letterNotFound
              : styles.letterFound
          }
        >
          A
        </Text>
        {isLongHunt && (
          <>
            <Text
              style={
                goalString.includes("r")
                  ? styles.letterNotFound
                  : styles.letterFound
              }
            >
              r
            </Text>
            <Text
              style={
                goalString.includes("c")
                  ? styles.letterNotFound
                  : styles.letterFound
              }
            >
              c
            </Text>
            <Text
              style={
                goalString.includes("h")
                  ? styles.letterNotFound
                  : styles.letterFound
              }
            >
              h
            </Text>
            <Text
              style={
                goalString.includes("i")
                  ? styles.letterNotFound
                  : styles.letterFound
              }
            >
              i
            </Text>
          </>
        )}
        <Text
          style={
            goalString.includes("p")
              ? styles.letterNotFound
              : styles.letterFound
          }
        >
          p
        </Text>
        {isLongHunt && (
          <>
            <Text
              style={
                goalString.includes("e")
                  ? styles.letterNotFound
                  : styles.letterFound
              }
            >
              e
            </Text>
            <Text
              style={
                goalString.includes("l")
                  ? styles.letterNotFound
                  : styles.letterFound
              }
            >
              l
            </Text>
            <Text
              style={
                goalString.includes("a")
                  ? styles.letterNotFound
                  : styles.letterFound
              }
            >
              a
            </Text>
          </>
        )}
        <Text
          style={
            goalString.includes("-")
              ? styles.letterNotFound
              : styles.letterFound
          }
        >
          -
        </Text>
        <Text
          style={
            goalString.includes("G")
              ? styles.letterNotFound
              : styles.letterFound
          }
        >
          G
        </Text>
        <Text
          style={
            goalString.includes("o")
              ? styles.letterNotFound
              : styles.letterFound
          }
        >
          o
        </Text>
        <Text
          style={
            goalString.includes("!")
              ? styles.letterNotFound
              : styles.letterFound
          }
        >
          !
        </Text>
      </Text>
    </View>
  );
}

export default function APInfoPopup({
  visible,
  closePopup,
  goalMode,
  goalString,
  amountOfKeys,
  remainingTrips,
}: Readonly<{
  visible: boolean;
  closePopup: () => void;
  goalMode: number;
  goalString: string;
  amountOfKeys: number;
  remainingTrips: number;
}>) {
  const getGoal = () => {
    switch (goalMode) {
      case GOAL_MAP.ALLSANITY:
        return (
          <>
            <Text style={styles.goal}>Allsanity</Text>
            <Text>
              {"\n"}Collect all remaining locations to achieve the goal.
            </Text>
          </>
        );
      case GOAL_MAP.SHORT_MACGUFFIN:
      case GOAL_MAP.LONG_MACGUFFIN:
        return (
          <>
            <Text style={styles.goal}>Macguffin hunt</Text>
            <Text>{"\n"}Find the remaining letters to achieve the goal.</Text>
          </>
        );
      default:
        return (
          <Text style={styles.goal}>
            Unsupported goal, or error in connection.
          </Text>
        );
    }
  };
  console.log("goalMode", goalMode);
  return (
    <Popup
      visible={visible}
      closePopup={closePopup}
      popupStyle={{ paddingTop: 0 }}
    >
      <Button onPress={closePopup} text="Close" buttonStyle={styles.button} />
      <View>
        <View
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Text>Current goal: {getGoal()}</Text>
        </View>
        {goalMode === GOAL_MAP.ALLSANITY && (
          <Text style={styles.item}>Remaining checks: {remainingTrips}</Text>
        )}
        {(goalMode === GOAL_MAP.SHORT_MACGUFFIN ||
          goalMode === GOAL_MAP.LONG_MACGUFFIN) && (
          <>
            <MacguffinHuntTracker
              goalString={goalString}
              isLongHunt={goalMode === GOAL_MAP.LONG_MACGUFFIN}
            />
            <Text style={styles.item}>
              You have found{" "}
              {goalMode === GOAL_MAP.LONG_MACGUFFIN
                ? longMacguffinString.length - goalString.length
                : shortMacguffinString.length - goalString.length}{" "}
              of{" "}
              {goalMode === GOAL_MAP.LONG_MACGUFFIN
                ? longMacguffinString.length
                : shortMacguffinString.length}{" "}
              macguffins.
            </Text>
          </>
        )}
        {goalMode === GOAL_MAP.ONE_HARD_TRAVEL && (
          <Text style={styles.item}>
            Goal mode has been set to One Hard Travel, which is not currently
            supported. You will not be able to reach your goal! Everything else
            should function correctly.
          </Text>
        )}
        <Text style={styles.item}>You have received {amountOfKeys} keys.</Text>
      </View>
    </Popup>
  );
}

const styles = StyleSheet.create({
  letterFound: {
    color: Colors.green,
    fontSize: 30,
    fontWeight: "bold",
  },
  letterNotFound: {
    color: Colors.black,
    fontSize: 30,
    fontWeight: "bold",
  },
  item: { marginBottom: 10 },
  button: { marginTop: 10, marginBottom: 10 },
  goal: { fontWeight: "bold", color: Colors.black },
});
