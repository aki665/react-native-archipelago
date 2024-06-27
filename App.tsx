// In App.js in a new project

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import "react-native-gesture-handler";
import React from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ClientContextProvider from "./components/ClientContext";
import ErrorContextProvider, { ErrorMessage } from "./components/ErrorContext";
import ConnectTabs from "./screens/ConnectTabs";
import Connected from "./screens/Connected";
require("react-native-get-random-values");

const Stack = createNativeStackNavigator();

const EmptyHeader = () => <></>;

function App() {
  return (
    <SafeAreaProvider>
      <ErrorContextProvider>
        <ClientContextProvider>
          <View style={{ flex: 15 }}>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="connect"
                screenOptions={{ header: EmptyHeader }}
              >
                <Stack.Screen name="connect" component={ConnectTabs} />
                <Stack.Screen name="connected" component={Connected} />
              </Stack.Navigator>
            </NavigationContainer>
          </View>
          <ErrorMessage />
        </ClientContextProvider>
      </ErrorContextProvider>
    </SafeAreaProvider>
  );
}
export default App;
