import { AntDesign } from "@expo/vector-icons";
import { MaterialTopTabNavigationHelpers } from "@react-navigation/material-top-tabs/lib/typescript/src/types";
import { FlashList } from "@shopify/flash-list";
import { ConnectionInformation, ITEMS_HANDLING_FLAGS } from "archipelago.js";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from "react-native";

import { ApInformation, apInfo } from "./Connect";
import APLicense from "../components/APLicense";
import Button from "../components/Button";
import { ClientContext } from "../components/ClientContext";
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

const EXTERNAL_EXTRA_DATA: string[] = []; // include extra storage keys you want to handle yourself in this array
const EXTRA_DATA: string[] = []; // include any extra storage keys in this array
const hiddenData: string[] = [...EXTERNAL_EXTRA_DATA, ...EXTRA_DATA]; // these values are hidden from the loadable list of connections

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

export default function Settings({
  navigation,
}: Readonly<{
  navigation: MaterialTopTabNavigationHelpers;
}>) {
  const [savedInfo, setSavedInfo] = useState<readonly string[] | undefined>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingValues, setEditingValues] = useState<undefined | apInfo>(
    undefined,
  );
  const [editingName, setEditingName] = useState<{
    originalName: string;
    newName: string;
  }>({
    originalName: "",
    newName: "",
  });
  const client = useContext(ClientContext);
  const { setError } = useContext(ErrorContext);

  const filterStorage = (item: string) => {
    let res = true;
    hiddenData.forEach((string) => {
      if (item.includes(string)) res = false;
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
      setLoading(true);
      const apInfo: apInfo = await load(storageName, STORAGE_TYPES.OBJECT);
      setEditingValues(apInfo);
      setEditingName({ originalName: storageName, newName: storageName });
      setLoading(false);
      setModalVisible(true);
    } catch (e) {
      setError(e);
    }
  };

  const connectToAP = async (storageName: string) => {
    try {
      setLoading(true);
      const apInfo: apInfo = await load(storageName, STORAGE_TYPES.OBJECT);
      const connectionInfo: ConnectionInformation = {
        protocol: "wss",
        tags: ["TextOnly"],
        game: "",
        items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
        ...apInfo,
      };

      await client.connect(connectionInfo);
      //client.say("connected to the server from react-native!");
      navigation.navigate("connected");
      setLoading(false);
    } catch (e) {
      setError(e);
      console.error(e);
      setLoading(false);
    }
  };

  const saveEditedInfo = async (apInfo: apInfo) => {
    try {
      setLoading(true);
      await save(apInfo, editingName.newName, STORAGE_TYPES.OBJECT);
      if (editingName.originalName !== editingName.newName) {
        await remove(editingName.originalName);
        if (EXTRA_DATA.length > 0) {
          EXTRA_DATA.forEach(async (item) => {
            const data = await load(
              editingName.originalName + item,
              STORAGE_TYPES.OBJECT,
            );
            await save(data, editingName.newName + item, STORAGE_TYPES.OBJECT);
            await remove(editingName.originalName + item);
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
    Alert.alert("Delete saved info", `Do you want to delete ${storageName}?`, [
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
                await remove(storageName + item);
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
    ]);
  };

  //const editInfo = async();
  useEffect(() => {
    fetchStorage();
  }, []);

  return (
    <View style={settingsStyles.settingsContainer}>
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
        <ApInformation
          onPress={saveEditedInfo}
          buttonText="Save"
          loading={loading}
          savedInfo={editingValues}
        />
      </Popup>
      <ScrollView nestedScrollEnabled>
        <View>
          <APLicense />
          <Text style={commonStyles.inputLabel}>Saved info</Text>
          <View
            style={{
              height: 700,
              width: Dimensions.get("screen").width - 5,
              borderWidth: 3,
              borderRadius: 5,
            }}
          >
            <FlashList
              estimatedItemSize={83}
              data={savedInfo}
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
      </ScrollView>
    </View>
  );
}
