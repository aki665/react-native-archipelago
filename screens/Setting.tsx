import { AntDesign } from "@expo/vector-icons";
import { MaterialTopTabNavigationHelpers } from "@react-navigation/material-top-tabs/lib/typescript/src/types";
import { FlashList } from "@shopify/flash-list";
import {
  Client,
  ConnectionInformation,
  ITEMS_HANDLING_FLAGS,
} from "archipelago.js";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApInformation, apInfo } from "./Connect";
import Button from "../components/Button";
import Popup from "../components/Popup";
import commonStyles from "../styles/CommonStyles";
import settingsStyles from "../styles/settingsStyles";
import { getAllNames, load, remove, save } from "../utils/storageHandler";

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
  console.log(item.length);
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
  const client = new Client();

  const fetchStorage = async () => {
    setLoading(true);
    const infoNames = await getAllNames();
    console.log(infoNames);
    setSavedInfo(infoNames);
    setLoading(false);
  };

  const editInfo = async (storageName: string) => {
    setLoading(true);
    const apInfo: apInfo = await load(storageName);
    setEditingValues(apInfo);
    setEditingName({ originalName: storageName, newName: storageName });
    setLoading(false);
    setModalVisible(true);
  };

  const connectToAP = async (storageName: string) => {
    try {
      setLoading(true);
      const apInfo: apInfo = await load(storageName);
      const connectionInfo: ConnectionInformation = {
        protocol: "wss",
        tags: ["AP", "TextOnly"],
        game: "",
        items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
        ...apInfo,
      };

      await client.connect(connectionInfo);
      //client.say("connected to the server from react-native!");
      navigation.navigate("connected", {
        client,
      });
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const saveEditedInfo = async (apInfo: apInfo) => {
    try {
      setLoading(true);
      await save(apInfo, editingName.newName);
      if (editingName.originalName !== editingName.newName) {
        await remove(editingName.originalName);
      }
      fetchStorage();
      setModalVisible(false);
      setLoading(false);
    } catch (e) {
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
          remove(storageName);
          setLoading(true);
          fetchStorage();
          setLoading(false);
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
    <SafeAreaView style={settingsStyles.settingsContainer}>
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
      <View>
        <Text style={commonStyles.inputLabel}>Saved info</Text>
        <View
          style={{ height: "80%", width: Dimensions.get("screen").width - 5 }}
        >
          {savedInfo?.length ? (
            <FlashList
              data={savedInfo}
              estimatedItemSize={savedInfo?.length}
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
          ) : (
            <Text>No saved connections</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
