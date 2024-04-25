import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Connect from "./Connect";
import Settings from "./Setting";

const Tab = createMaterialTopTabNavigator();

const Placeholder = () => {
  return <></>;
};

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
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
}
