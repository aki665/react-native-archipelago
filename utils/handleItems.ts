import { ITEM_FLAGS, NetworkItem, ReceivedItemsPacket } from "archipelago.js";

import { STORAGE_TYPES, load, save } from "./storageHandler";

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

async function handleTrap(item: NetworkItem) {}

export default async function handleItems(
  items: readonly NetworkItem[],
  sessionName: string,
  newIndex: number,
) {
  const index: number =
    (await load(sessionName + "_itemIndex", STORAGE_TYPES.OBJECT)) || 0;

  let keyAmount = 0;
  let distanceReductions = 0;
  items.forEach(async (item, i) => {
    if (item.item === MAP_ID_TO_ITEM.KEY) keyAmount++;
    if (item.item === MAP_ID_TO_ITEM.COLLECTION_DISTANCE) distanceReductions++;
    if (i < index) {
      // Do nothing if item is already handled
    } else if (item.flags === ITEM_FLAGS.TRAP) {
      await handleTrap(item);
    }
  });
  await save(newIndex, sessionName + "_itemIndex", STORAGE_TYPES.NUMBER);
  return { keyAmount, distanceReductions };
}
