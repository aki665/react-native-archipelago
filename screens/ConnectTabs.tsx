import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Connect from "./Connect";
import SavedInfo from "./SavedInfo";
import Settings from "./Settings";

const Tab = createMaterialTopTabNavigator();

export default function ConnectTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Connect"
      style={{ paddingTop: insets.top }}
    >
      <Tab.Screen name="Connect">
        {(props) => <Connect {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Saved Connections" component={SavedInfo} />
      <Tab.Screen name="Settings">
        {(props) => <Settings {...props} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
