import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import React, { useContext, useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableHighlight, View } from "react-native";

import APConnectionInfo, { apInfo } from "../components/APConnectionInfo";
import Button from "../components/Button";
import { APInfo, ClientContext } from "../components/ClientContext";
import { ErrorContext } from "../components/ErrorContext";
import Popup from "../components/Popup";
import commonStyles from "../styles/CommonStyles";
import settingsStyles from "../styles/settingsStyles";
import {
  STORAGE_TYPES,
  getAllNames,
  load,
  remove,
  save,
} from "../utils/storageHandler";
import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";

const EXTERNAL_EXTRA_DATA: string[] = ["__settings"]; // include extra storage keys you want to handle yourself in this array
export const EXTRA_DATA: { name: string; type: string }[] = [
  { name: "_trips", type: STORAGE_TYPES.OBJECT },
  { name: "_itemIndex", type: STORAGE_TYPES.NUMBER },
  { name: "_checked", type: STORAGE_TYPES.OBJECT },
]; // include any extra storage keys in this array
const hiddenData: any[] = [...EXTERNAL_EXTRA_DATA, ...EXTRA_DATA]; // these values are hidden from the loadable list of connections

const ListItem = ({
  item,
  connectToAp,
  editInfo,
  deleteItem,
}: {
  item: string;
  connectToAp: (item: string) => Promise<void>;
  editInfo: (item: string) => Promise<void>;
  deleteItem: (item: string) => Promise<void>;
}) => {
  let fontSize = 20;
  if (item.length > 30) fontSize = 15;
  return (
    <TouchableHighlight
      activeOpacity={0.6}
      underlayColor="#DDDDDD"
      style={settingsStyles.item}
      onPress={() => {
        connectToAp(item);
      }}
    >
      <>
        <Text style={{ fontSize, flex: 8 }}>{item}</Text>
        <Button
          text=""
          removeText
          onPress={() => {
            editInfo(item);
          }}
          buttonStyle={{ flex: 1, marginLeft: 10 }}
          endIcon={<AntDesign name="edit" size={20} color="white" />}
        />
        <Button
          text=""
          removeText
          onPress={() => {
            deleteItem(item);
          }}
          buttonStyle={{ flex: 1, marginLeft: 10 }}
          endIcon={<AntDesign name="delete" size={20} color="white" />}
        />
      </>
    </TouchableHighlight>
  );
};

const debugButtons = () => {
  const junkData = Array.from(Array(10).keys());
  const makeMockSaves = () => {
    junkData.forEach(async (item) => {
      await save(
        item,
        Math.random().toString() + Math.random().toString(),
        STORAGE_TYPES.NUMBER,
      );
    });
  };
  const deleteAllData = async () => {
    const infoNames = await getAllNames();
    infoNames?.forEach((item) => {
      remove(item);
    });
  };

  return (
    <View>
      <Button onPress={makeMockSaves} text="create junk data" />
      <Button onPress={deleteAllData} text="delete all saved data" />
    </View>
  );
};

export default function SavedInfo({
  navigation,
}: Readonly<{
  navigation: MaterialTopTabBarProps["navigation"];
}>) {
  const nav = useNavigation();
  const [savedInfo, setSavedInfo] = useState<readonly string[] | undefined>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingValues, setEditingValues] = useState<undefined | APInfo>(
    undefined,
  );
  const [editingName, setEditingName] = useState<{
    originalName: string;
    newName: string;
  }>({
    originalName: "",
    newName: "",
  });
  const { client, connectionInfoRef } = useContext(ClientContext);
  const { setError } = useContext(ErrorContext);

  const filterStorage = (item: string) => {
    let res = true;
    hiddenData.forEach((string) => {
      if (item.includes(string) || item.includes(string?.name)) res = false;
    });
    return res;
  };

  const fetchStorage = async () => {
    try {
      setLoading(true);
      const infoNames = await getAllNames();
      console.log(infoNames);
      const filteredNames =
        hiddenData.length > 0 ? infoNames?.filter(filterStorage) : infoNames;
      setSavedInfo(filteredNames);
      setLoading(false);
    } catch (e) {
      setError(e);
      console.log(e);
    }
  };

  const editInfo = async (storageName: string) => {
    try {
      if (!client.socket.connected) {
        setLoading(true);
        const savedInfo: APInfo = await load(storageName, STORAGE_TYPES.OBJECT);
        setEditingValues(savedInfo);
        setEditingName({ originalName: storageName, newName: storageName });
        setLoading(false);
        setModalVisible(true);
      }
    } catch (e) {
      setError(e);
    }
  };

  const connectToAP = async (storageName: string) => {
    try {
      if (!client.socket.connected) {
        setLoading(true);
        const apInfo: APInfo = await load(storageName, STORAGE_TYPES.OBJECT);
        await client.login(
          apInfo.url,
          apInfo.name,
          apInfo.game,
          apInfo.connectionInfo,
        );
        if (connectionInfoRef !== null) {
          connectionInfoRef.current = apInfo;
        }
        //client.say("connected to the server from react-native!");
        navigation.navigate("connected", {
          sessionName: storageName,
        });
        setLoading(false);
      }
    } catch (e) {
      setError(e);
      console.error(e);
      setLoading(false);
    }
  };

  const saveEditedInfo = async (apInfo: apInfo) => {
    try {
      if (editingValues === undefined)
        throw new TypeError("Editing value is not of type APInfo");
      setLoading(true);
      const newInfo: APInfo = {
        ...editingValues,
        url: apInfo.hostname + ":" + apInfo.port.toString(),
        name: apInfo.name,
        connectionInfo: {
          ...editingValues.connectionInfo,
          password: apInfo.password,
        },
      };
      await save(newInfo, editingName.newName, STORAGE_TYPES.OBJECT);
      if (editingName.originalName !== editingName.newName) {
        await remove(editingName.originalName);
        if (EXTRA_DATA.length > 0) {
          EXTRA_DATA.forEach(async (item) => {
            const data = await load(
              editingName.originalName + item.name,
              item.type,
            );
            await save(data, editingName.newName + item.name, item.type);
            await remove(editingName.originalName + item.name);
          });
        }
      }
      fetchStorage();
      setModalVisible(false);
      setLoading(false);
    } catch (e) {
      setError(e);
      console.log(e);
    }
  };

  const deleteSavedInfo = async (storageName: string) => {
    if (!client.socket.connected) {
      Alert.alert(
        "Delete saved info",
        `Do you want to delete ${storageName}?`,
        [
          {
            text: "Cancel",
            onPress: () => null,
          },
          {
            text: "Delete",
            onPress: () => {
              try {
                setLoading(true);
                remove(storageName);
                if (EXTRA_DATA.length > 0) {
                  EXTRA_DATA.forEach(async (item) => {
                    await remove(storageName + item.name);
                  });
                }
                fetchStorage();
                setLoading(false);
              } catch (e) {
                console.log(e);
                setError(e);
              }
            },
            style: "cancel",
          },
        ],
      );
    }
  };

  useEffect(() => {
    const unsubscribe = nav.addListener("focus", () => {
      fetchStorage();
    });

    return unsubscribe;
  }, [nav]);

  //const editInfo = async();
  useEffect(() => {
    fetchStorage();
  }, []);

  return (
    <View
      style={{ height: "100%", flex: 1, alignItems: "center", marginTop: 3 }}
    >
      <Popup
        visible={modalVisible}
        closePopup={() => {
          Alert.alert(
            "Discard changes?",
            "Do you want to discard the changes made to this saved connection?",
            [
              {
                text: "Cancel",
                onPress: () => null,
                style: "cancel",
              },
              {
                text: "YES",
                onPress: () => {
                  setModalVisible(!modalVisible);
                },
              },
            ],
          );
        }}
      >
        <View>
          <Text style={commonStyles.inputLabel}>Name of saved connection</Text>
          <TextInput
            style={commonStyles.textInput}
            onChangeText={(text) => {
              setEditingName({ ...editingName, newName: text });
            }}
            editable={!loading}
            value={editingName.newName}
            placeholder="Name of saved connection"
          />
        </View>
        <APConnectionInfo
          onPress={saveEditedInfo}
          buttonText="Save"
          loading={loading}
          savedInfo={editingValues?.apInfo}
        />
      </Popup>
      <View style={{ width: "98%", height: "100%" }}>
        <FlashList
          data={savedInfo}
          estimatedItemSize={83}
          nestedScrollEnabled
          ListEmptyComponent={<Text>No saved connections</Text>}
          renderItem={({ item }) => (
            <ListItem
              item={item}
              connectToAp={connectToAP}
              editInfo={editInfo}
              deleteItem={deleteSavedInfo}
            />
          )}
          onRefresh={fetchStorage}
          refreshing={loading}
        />
      </View>
    </View>
  );
}
