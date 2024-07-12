import { Client, ITEM_FLAGS, NetworkItem } from "archipelago.js";

import { STORAGE_TYPES, load, save } from "./storageHandler";
import AsyncAlert from "../components/AsyncAlert";

export const ITEM_ID_OFFSET = 8902301100000;
export const MAP_ID_TO_ITEM = {
  DISTANCE_REDUCTION: ITEM_ID_OFFSET + 1,
  KEY: ITEM_ID_OFFSET + 2,
  SCOUTING_DISTANCE: ITEM_ID_OFFSET + 3,
  COLLECTION_DISTANCE: ITEM_ID_OFFSET + 4,

  SHUFFLE_TRAP: ITEM_ID_OFFSET + 101,
  SILENCE_TRAP: ITEM_ID_OFFSET + 102,
  FOG_OF_WAR_TRAP: ITEM_ID_OFFSET + 103,

  PUSH_UP_TRAP: ITEM_ID_OFFSET + 151,
  SOCIALIZING_TRAP: ITEM_ID_OFFSET + 152,
  SIT_UP_TRAP: ITEM_ID_OFFSET + 153,
  JUMPING_JACK_TRAP: ITEM_ID_OFFSET + 154,
  TOUCH_GRASS_TRAP: ITEM_ID_OFFSET + 155,

  MACGUFFIN_A: ITEM_ID_OFFSET + 201,
  MACGUFFIN_R: ITEM_ID_OFFSET + 202,
  MACGUFFIN_C: ITEM_ID_OFFSET + 203,
  MACGUFFIN_H: ITEM_ID_OFFSET + 204,
  MACGUFFIN_I: ITEM_ID_OFFSET + 205,
  MACGUFFIN_P: ITEM_ID_OFFSET + 206,
  MACGUFFIN_E: ITEM_ID_OFFSET + 207,
  MACGUFFIN_L: ITEM_ID_OFFSET + 208,
  MACGUFFIN_A2: ITEM_ID_OFFSET + 209,
  MACGUFFIN_HYPHEN: ITEM_ID_OFFSET + 210,
  MACGUFFIN_G: ITEM_ID_OFFSET + 211,
  MACGUFFIN_O: ITEM_ID_OFFSET + 212,
  MACGUFFIN_EXCLAMATION: ITEM_ID_OFFSET + 213,
};

export const GOAL_MAP = {
  ONE_HARD_TRAVEL: 0,
  ALLSANITY: 1,
  SHORT_MACGUFFIN: 2,
  LONG_MACGUFFIN: 3,
};

async function handleTrap(item: NetworkItem) {}

export default async function handleItems(
  items: readonly NetworkItem[],
  sessionName: string,
  newIndex: number,
  client: Client,
  goal = 1,
) {
  let index = -1;

  try {
    index = await load(sessionName + "_itemIndex", STORAGE_TYPES.NUMBER);
  } catch {
    console.log("Could not load saved index...");
  }

  const itemPackage =
    client.data.package.get("Archipela-Go!")?.item_id_to_name || {};
  let keyAmount = 0;
  let distanceReductions = 0;
  let skipNotifications = false;

  let macguffinString = "";

  if (goal === GOAL_MAP.SHORT_MACGUFFIN) macguffinString = "Ap-Go!";
  if (goal === GOAL_MAP.LONG_MACGUFFIN) macguffinString = "Archipela-Go!";

  items.forEach(async (item, i) => {
    console.log("handling item", item);
    if (item.item === MAP_ID_TO_ITEM.KEY) keyAmount++;
    if (item.item === MAP_ID_TO_ITEM.COLLECTION_DISTANCE) distanceReductions++;
    if (macguffinString) {
      switch (item.item) {
        case MAP_ID_TO_ITEM.MACGUFFIN_A:
          macguffinString = macguffinString.replace("A", "");
          break;
        case MAP_ID_TO_ITEM.MACGUFFIN_R:
          macguffinString = macguffinString.replace("r", "");
          break;
        case MAP_ID_TO_ITEM.MACGUFFIN_C:
          macguffinString = macguffinString.replace("c", "");
          break;

        case MAP_ID_TO_ITEM.MACGUFFIN_H:
          macguffinString = macguffinString.replace("h", "");
          break;

        case MAP_ID_TO_ITEM.MACGUFFIN_I:
          macguffinString = macguffinString.replace("i", "");
          break;

        case MAP_ID_TO_ITEM.MACGUFFIN_P:
          macguffinString = macguffinString.replace("p", "");
          break;

        case MAP_ID_TO_ITEM.MACGUFFIN_E:
          macguffinString = macguffinString.replace("e", "");
          break;

        case MAP_ID_TO_ITEM.MACGUFFIN_L:
          macguffinString = macguffinString.replace("l", "");
          break;

        case MAP_ID_TO_ITEM.MACGUFFIN_A2:
          macguffinString = macguffinString.replace("a", "");
          break;

        case MAP_ID_TO_ITEM.MACGUFFIN_HYPHEN:
          macguffinString = macguffinString.replace("-", "");
          break;

        case MAP_ID_TO_ITEM.MACGUFFIN_G:
          macguffinString = macguffinString.replace("G", "");
          break;

        case MAP_ID_TO_ITEM.MACGUFFIN_O:
          macguffinString = macguffinString.replace("o", "");
          break;

        case MAP_ID_TO_ITEM.MACGUFFIN_EXCLAMATION:
          macguffinString = macguffinString.replace("!", "");
          break;
      }
    }
    if (i <= index) {
      // Do nothing if item is already handled
    } else {
      const itemName = itemPackage[item.item] || "";
      if (!skipNotifications) {
        await AsyncAlert(
          "Item received!",
          `Received ${itemName} from ${client.players.name(item.player)}`,
          [
            {
              text: "Skip all",
              onPress: () => (skipNotifications = true),
            },
            {
              text: "OK",
              onPress: () => null,
            },
          ],
        );
      }
      if (item.flags === ITEM_FLAGS.TRAP) {
        await handleTrap(item);
      } else if (item.flags === ITEM_FLAGS.PROGRESSION) {
      }
    }
  });
  await save(newIndex, sessionName + "_itemIndex", STORAGE_TYPES.NUMBER);
  return { keyAmount, distanceReductions, macguffinString };
}
