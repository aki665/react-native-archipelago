import AsyncStorage from "@react-native-async-storage/async-storage";

export async function save(value: object, name: string) {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(name, jsonValue);
  } catch (e) {
    console.log(e);
  }
}

export async function load(name: string) {
  try {
    const jsonValue = await AsyncStorage.getItem(name);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    // error reading value
    console.log(e);
  }
}

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
