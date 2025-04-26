import React, {
  ReactNode,
  createContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { load, save, STORAGE_TYPES } from "../utils/storageHandler";
import { locationInfo } from "./LocationInfoPopup";

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
  value:
    | string
    | boolean
    | number
    | object
    | any[]
    | null
    | locationInfo["coords"][];
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
      : T extends "array"
        ? any[]
        : T extends "object"
          ? object
          : never;

type getSettingTypeNames = "string" | "number" | "boolean" | "array" | "object";

/**
 * Add settings here to make them show up in the settings screen
 */
const defaultSettings: Settings[] = [
  {
    name: "AUTOMATIC_RECONNECTION",
    displayName: "Automatic reconnection",
    description:
      "Determines if the app reconnects to archipelago automatically or not",
    value: true,
  },
  {
    name: "AUTO_RETRY_AMOUNT",
    displayName: "Reconnect attempt amount",
    description:
      "Determines how many times the app should try automatic reconnection before " +
      "notifying the user and disconnecting.\nDefault: 5" +
      "\nNot used if automatic reconnection is turned off.",
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
  {
    name: "MARKER_RADIUS",
    displayName: "Location radius",
    description:
      "Determines the distance from which a location can be collected (in meters). Default is 20. Allowed values are 10 - 100",
    value: 20,
    maxValue: 100,
    minValue: 10,
  },
  {
    name: "LOCATION_RETRIES",
    displayName: "Retry location amount",
    description:
      "Determines how many times the app should try generating unique trips before continuing." +
      "\nIf set to zero, locations are not checked for uniqueness, causing multiple checks to be in the same location." +
      "\nShould be lower if playing in an area with few roads or with many locations." +
      "\nDefault: 5",
    value: 5,
  },
  {
    name: "ALWAYS_BAN_REROLL_LOCATION",
    displayName: "Ban all rerolled locations",
    description:
      "Determines if all rerolled locations should be banned added to the list of banned locations." +
      "\nBanning too many locations can affect location generation times" +
      "\nDefault: false",
    value: false,
  },
  {
    name: "CAN_ALWAYS_SEND_LOCATION",
    displayName: "CHEAT: Allow free location sending",
    description:
      "Allow checks to be sent with a button." +
      "\nIf set to true, a button in the location info popup can be pressed to always send a location." +
      "\nIf false, the button checks if you are within the marker radius." +
      "\nDefault: false",
    value: false,
  },
  {
    name: "HOME_LOCATION",
    displayName: "Home location",
    description: "User defined location used in marker generation",
    value: {
      lat: null,
      lon: null,
    },
  },
  {
    name: "USE_HOME_LOCATION",
    displayName: "Use home location",
    description: "",
    value: false,
  },
  {
    name: "MIN_RADIAN",
    displayName: "Min allowed radian",
    description: "",
    value: 0,
  },
  {
    name: "MAX_RADIAN",
    displayName: "Max allowed radian",
    description: "",
    value: 6.283185,
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
  handleSettingChange: (newValue: Settings["value"], name: string) => void;
  getSetting: <T extends getSettingTypeNames>(
    name: string,
    type: T,
  ) => getSettingType<T>;
}>({
  settings: defaultSettings,
  handleSettingChange: () => {},
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
    if (res !== undefined) return res as getSettingType<T>;
    else {
      throw new TypeError("Setting does not exist or is of wrong type!");
    }
  }

  /**
   * Change a setting both in the context state and local storage
   * @param newValue new value of the setting
   * @param name name of the setting
   */
  const handleSettingChange = async (
    newValue: Settings["value"],
    name: string,
  ) => {
    console.log("Saving", newValue, "as new value of", name);
    const newSettings = settings;
    const newSettingIndex = newSettings.findIndex(
      (setting) => setting.name === name,
    );
    newSettings[newSettingIndex].value = newValue;
    await save(newSettings, "__settings", STORAGE_TYPES.OBJECT);
    setSettings(newSettings);
  };

  const contextValue = useMemo(
    () => ({ settings, handleSettingChange, getSetting }),
    [settings],
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}
