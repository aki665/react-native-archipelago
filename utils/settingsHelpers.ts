import * as Location from "expo-location";
import { Alert, Linking } from "react-native";

export async function handleAutoSendingToggle(enabled: boolean) {
  const bgPermission = await Location.getBackgroundPermissionsAsync();
  if (enabled && !bgPermission.granted) {
    Alert.alert(
      "Background location permission required!",
      "Background location permission is required for automatic location sending.",
      [
        {
          text: "Go to settings",
          onPress: async () => {
            void Location.requestBackgroundPermissionsAsync();
          },
        },
      ],
    );
  } else if (!enabled && bgPermission.granted) {
    Alert.alert(
      "Background location no longer required",
      "Background location permission is not required if automatic location checking is disabled.",
      [
        {
          text: "Go to settings",
          onPress: async () => {
            Linking.openSettings();
          },
        },
        {
          text: "Ok",
        },
      ],
    );
  }
}
