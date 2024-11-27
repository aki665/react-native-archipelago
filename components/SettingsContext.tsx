import React, {
  ReactNode,
  createContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { load, STORAGE_TYPES } from "../utils/storageHandler";

export type Settings = {
  name: string;
  displayName: string;
  description: string;
  value: string | boolean | number;
};

const defaultSettings: Settings[] = [
  {
    name: "CHECK_CONNECTION_TIME",
    displayName: "Connection timeout",
    description:
      "Determines how often connection status is checked (in seconds)\nDefault:5",
    value: 5,
  },
];

/**
 * Used to get the client from the context using useContext(ClientContext)
 */
export const SettingsContext = createContext<{
  settings: Settings[];
  setSettings: React.Dispatch<React.SetStateAction<Settings[]>>;
}>({ settings: defaultSettings, setSettings: () => {} });

/**
 * Returns a provider for the clientContext.
 * Is imported and rendered by App.tsx, so the client context is available in the rest of the app.
 */
export default function SettingsContextProvider({
  children,
}: Readonly<{
  children?: ReactNode | ReactNode[];
}>) {
  const [settings, setSettings] = useState(defaultSettings);

  const loadSavedSettings = async () => {
    const loadedSettings: Settings[] | null = await load(
      "__settings",
      STORAGE_TYPES.OBJECT,
    );

    if (loadedSettings !== null) {
      loadedSettings.forEach((setting, index) => {
        const defaultSetting = defaultSettings.find(
          (dSetting) => dSetting.name === setting.name,
        );
        if (defaultSetting !== undefined) {
          loadedSettings[index].description = defaultSetting.description;
        } else {
          loadedSettings.splice(index, 1);
        }
      });
      setSettings(loadedSettings);
    }
  };
  useEffect(() => {
    loadSavedSettings();
  }, []);

  const contextValue = useMemo(() => ({ settings, setSettings }), [settings]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}
