import React, {
  ReactNode,
  createContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { load, STORAGE_TYPES } from "../utils/storageHandler";

export type Settings = {
  /**
   * Internal name of the setting.
   */
  name: string;
  /**
   * Name displayed in the settings screen
   */
  displayName: string;
  /**
   * Description shown in a popup in the settings screen
   */
  description: string;
  /**
   * Value of the setting. Default is set in {@link defaultSettings}
   */
  value: string | boolean | number;
  /**
   * Only used for numeric values. Maximum allowed value of the setting.
   */
  maxValue?: number;
  /**
   * Only used for numeric values. Minimum allowed value of the setting. If not set, 0 is the smallest value allowed.
   */
  minValue?: number;
};

type getSettingType<T> = T extends "number"
  ? number
  : T extends "boolean"
    ? boolean
    : T extends "string"
      ? string
      : never;

type getSettingTypeNames = "string" | "number" | "boolean";
/**
 * Add settings here to make them show up in the settings screen
 */
const defaultSettings: Settings[] = [
  {
    name: "CHECK_CONNECTION_TIME",
    displayName: "Connection timeout",
    description:
      "Determines how often connection status is checked (in seconds)\nDefault: 120",
    value: 120,
  },
  {
    name: "AUTO_RETRY_AMOUNT",
    displayName: "Reconnect attempt amount",
    description:
      "Determines how many times the app should try automatic reconnection before " +
      "notifying the user and disconnecting.\nDefault: 5",
    value: 5,
  },
  {
    name: "NEAR_ZOOM",
    displayName: "Allow multiple locations on the same road",
    description:
      "Allow location checks to be on the same road. e.g. Address 1 and Address 2 vs just one at Address" +
      "\nIs automatically used if location generation is failed too many times" +
      "\n\nShould be turned on if playing in an area with few roads or many locations to speed up generation" +
      "\nDefault: false",
    value: false,
  },
];
/**
 *
 * @param name Name of the setting to get
 * @param type Type of the setting
 * @returns the value of the setting if it exist and is of the specified type
 * Otherwise, throws an error
 */
function getSetting<T extends getSettingTypeNames>(
  name: string,
  type: T,
): getSettingType<T> {
  const res = defaultSettings.find((setting) => setting.name === name)?.value;
  if (res !== undefined && typeof res === type) return res as getSettingType<T>;
  else {
    throw new TypeError("Setting does not exist or is of wrong type!");
  }
}

/**
 * Used to get the client from the context using useContext(ClientContext)
 */
export const SettingsContext = createContext<{
  settings: Settings[];
  setSettings: React.Dispatch<React.SetStateAction<Settings[]>>;
  getSetting: <T extends "string" | "number" | "boolean">(
    name: string,
    type: T,
  ) => getSettingType<T>;
}>({
  settings: defaultSettings,
  setSettings: () => {},
  getSetting,
});

/**
 * Returns a provider for the settingsContext.
 * Is imported and rendered by App.tsx, so the settings context is available in the rest of the app.
 */
export default function SettingsContextProvider({
  children,
}: Readonly<{
  children?: ReactNode | ReactNode[];
}>) {
  const [settings, setSettings] = useState(defaultSettings);

  /**
   * Loads saved settings, updates descriptions and removes settings that do not exist
   */
  const loadSavedSettings = async () => {
    const loadedSettings: Settings[] | null = await load(
      "__settings",
      STORAGE_TYPES.OBJECT,
    );

    const filteredSettings: Settings[] = [];
    if (loadedSettings !== null) {
      defaultSettings.forEach((setting, index) => {
        const loadedSetting = loadedSettings.find(
          (dSetting) => dSetting.name === setting.name,
        );
        if (loadedSetting !== undefined) {
          setting.value = loadedSetting.value;
        }
        filteredSettings.push(setting);
      });

      setSettings(filteredSettings);
    }
  };
  useEffect(() => {
    loadSavedSettings();
  }, []);

  /**
   *
   * @param name Name of the setting to get
   * @param type Type of the setting
   * @returns the value of the setting if it exist and is of the specified type
   * Otherwise, throws an error
   */
  function getSetting<T extends getSettingTypeNames>(
    name: string,
    type: T,
  ): getSettingType<T> {
    const res = settings.find((setting) => setting.name === name)?.value;
    if (res !== undefined && typeof res === type)
      return res as getSettingType<T>;
    else {
      throw new TypeError("Setting does not exist or is of wrong type!");
    }
  }

  const contextValue = useMemo(
    () => ({ settings, setSettings, getSetting }),
    [settings],
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}
