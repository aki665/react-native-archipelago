import { Alert, AlertButton, AlertOptions } from "react-native";

/**
 * An asynchronous version of React Native Alert, that can be used to show subsequent Alerts.
 * NEEDS TO BE AWAITED
 * Takes the same arguments as the normal Alert.alert
 */
export default async function AsyncAlert(
  title: string,
  message?: string | undefined,
  buttons?: AlertButton[] | undefined,
  options?: AlertOptions | undefined,
) {
  await new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      buttons?.map((button) => {
        return {
          ...button,
          onPress: () => {
            if (button.onPress) {
              button.onPress();
              resolve("");
            }
          },
        };
      }),
      options,
    );
  });
}
