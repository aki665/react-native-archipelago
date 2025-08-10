import { ConnectionOptions, Client } from "archipelago.js";
import React, {
  ReactNode,
  RefObject,
  createContext,
  useMemo,
  useRef,
} from "react";

import { apInfo } from "./APConnectionInfo";

export type APInfo = {
  url: string | URL;
  name: string;
  game: string;
  connectionInfo: ConnectionOptions;
  apInfo?: apInfo;
};

/**
 * Used to get the client from the context using useContext(ClientContext)
 */
export const ClientContext = createContext<{
  client: Client;
  connectionInfoRef: RefObject<APInfo | null> | null;
}>({
  client: new Client(),
  connectionInfoRef: null,
});

/**
 * Returns a provider for the clientContext.
 * Is imported and rendered by App.tsx, so the client context is available in the rest of the app.
 */
export default function ClientContextProvider({
  children,
}: Readonly<{
  children?: ReactNode | ReactNode[];
}>) {
  const client = useMemo(() => new Client(), []);
  const connectionInfoRef = useRef<APInfo | null>(null);
  const contextValue = useMemo(() => ({ client, connectionInfoRef }), [client]);
  return (
    <ClientContext.Provider value={contextValue}>
      {children}
    </ClientContext.Provider>
  );
}
