// In App.js in a new project

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ClientContextProvider from "./components/ClientContext";
import ConnectTabs from "./screens/ConnectTabs";
import Connected from "./screens/Connected";
require("react-native-get-random-values");

const Stack = createNativeStackNavigator();

const EmptyHeader = () => <></>;

function App() {
  return (
    <SafeAreaProvider>
      <ClientContextProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="connect"
            screenOptions={{ header: EmptyHeader }}
          >
            <Stack.Screen name="connect" component={ConnectTabs} />
            <Stack.Screen name="connected" component={Connected} />
          </Stack.Navigator>
        </NavigationContainer>
      </ClientContextProvider>
    </SafeAreaProvider>
  );
}

export default App;
