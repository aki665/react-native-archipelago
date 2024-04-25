import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Save an object into storage. Uses JSON.stringify.
 * @param value object to save to storage
 * @param name name of the object. used in loading
 */
export async function save(value: object, name: string) {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(name, jsonValue);
  } catch (e) {
    console.log(e);
  }
}

/**
 * Retrieve an object from storage.
 * @param name name of the saved object
 * @returns the saved object
 */
export async function load(name: string) {
  try {
    const jsonValue = await AsyncStorage.getItem(name);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
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
