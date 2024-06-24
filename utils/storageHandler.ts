import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_TYPES = {
  OBJECT: "object",
  STRING: "string",
  NUMBER: "number",
};

/**
 * Save a value into storage. Uses JSON.stringify.
 * @param value value to save to storage
 * @param name name of the value. used in loading
 * @param type type of the value given. @see STORAGE_TYPES for supported values
 */
export async function save(
  value: object | string | number,
  name: string,
  type: string,
) {
  try {
    if (typeof value !== type) {
      console.error("Could not save value! Invalid type!");
      console.log("tried to save", value, "as", type);
      return;
    }
    switch (type) {
      case STORAGE_TYPES.OBJECT: {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(name, jsonValue);
        break;
      }
      case STORAGE_TYPES.NUMBER:
        await AsyncStorage.setItem(name, value.toString());
        break;
      case STORAGE_TYPES.STRING:
        await AsyncStorage.setItem(name, value);
        break;
      default:
        console.error("Could not save value! Unsupported type!");
        console.log("tried to save", value, "as", type);
    }
  } catch (e) {
    console.log(e);
  }
}

/**
 * Retrieve an value from storage.
 * @param name name of the saved value
 * @param type type of the saved value. @see STORAGE_TYPES for supported values
 * @returns the saved value
 */
export async function load(name: string, type: string) {
  try {
    const value = await AsyncStorage.getItem(name);
    if (!value) return null;

    switch (type) {
      case STORAGE_TYPES.OBJECT: {
        return JSON.parse(value);
      }
      case STORAGE_TYPES.NUMBER:
        return parseInt(value, 10);
      case STORAGE_TYPES.STRING:
        return value;
      default:
        console.error("Could not load value!");
    }
  } catch (e) {
    // error reading value
    console.log(e);
  }
}

/**
 * Gets all keys known to your app; for all callers, libraries, etc.
 */
export async function getAllNames() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log(keys);
    return keys;
  } catch (e) {
    // read key error
    console.log(e);
  }
}

/**
 * This allows you to batch the fetching of items given an array of key inputs. Your callback will be invoked with an array of corresponding key-value pairs found
 * @param names list of all names to get from storage
 * @returns
 */
export async function loadAll(names: string[]) {
  let values;
  try {
    values = await AsyncStorage.multiGet(names);
  } catch (e) {
    // read error
    console.log(e);
  }
  console.log(values);
  return values;
}

/**
 * Remove specified item from storage
 */
export async function remove(name: string) {
  try {
    await AsyncStorage.removeItem(name);
    console.log("Deleted item", name);
  } catch (e) {
    // remove error
    console.log(e);
  }
}

export default AsyncStorage;
