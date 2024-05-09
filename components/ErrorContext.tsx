import { AntDesign } from "@expo/vector-icons";
import { CONNECTION_ERROR } from "archipelago.js";
import React, { ReactNode, createContext, useContext, useState } from "react";
import { Text, View } from "react-native";

import Button from "./Button";
import errorStyles from "../styles/ErrorStyles";

/**
 * Used to get the get and set the error from the context using useContext(ErrorContext)
 */

export const ErrorContext = createContext<{
  error: unknown;
  setError: React.Dispatch<React.SetStateAction<unknown>>;
}>({
  error: "",
  setError: (_error: unknown) => {},
});

/**
 * Handles most common error types.
 * If any new errors, or weird error messages show up, they should be handled here.
 */
export const composeError = (error: any) => {
  if (Object.values(CONNECTION_ERROR).includes(error[0])) {
    switch (error[0]) {
      case CONNECTION_ERROR.INVALID_SLOT:
        return "Invalid slot name";
      case CONNECTION_ERROR.INVALID_PASSWORD:
        return "Invalid password";
    }
  } else if (typeof error === "string") return error;
  else if (error?.message) return error.message;
  else if (error[0]?.message) return error[0]?.message;
  else if (error?.isArray) return error.join(",");
  else if (error?.toString) return error.toString();
};

/**
 * Returns a provider for the ErrorContext.
 * Is imported and rendered by App.tsx, so the error context is available in the rest of the app.
 * Uses a useState hook, so that error message re-renders when value is changed.
 */
export default function ErrorContextProvider({
  children,
}: Readonly<{
  children?: ReactNode | ReactNode[];
}>) {
  const [error, setError] = useState<unknown>("");
  const errorValue = { error, setError };
  return (
    <ErrorContext.Provider value={errorValue}>{children}</ErrorContext.Provider>
  );
}

/**
 * Helper method to figure out the font size of the error message
 */
function getFontSize(length: number) {
  console.log(length);
  if (length > 40) return 16;
  else if (length > 20) return 18;
  else return 25;
}

/**
 * Renders error message as a string at the bottom of the app
 */
export function ErrorMessage() {
  const { error, setError } = useContext(ErrorContext);
  const errorString = composeError(error);
  console.log(errorString);
  const fontSize = getFontSize(errorString.length);
  console.log(fontSize);
  return (
    <>
      {!!error && (
        <View style={errorStyles.container}>
          <View style={errorStyles.icon}>
            <AntDesign name="exclamationcircleo" size={50} color="red" />
          </View>
          <Text style={{ ...errorStyles.text, fontSize }}>{errorString}</Text>
          <Button
            buttonStyle={errorStyles.button}
            text="dismiss"
            onPress={() => setError("")}
          />
        </View>
      )}
    </>
  );
}
