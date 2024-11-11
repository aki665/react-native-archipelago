import { Client, ConnectionInformation } from "archipelago.js";
import React, {
  MutableRefObject,
  ReactNode,
  createContext,
  useMemo,
  useRef,
} from "react";

/**
 * Used to get the client from the context using useContext(ClientContext)
 */
export const ClientContext = createContext<{
  client: Client;
  connectionInfoRef: MutableRefObject<ConnectionInformation | null> | null;
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
  const connectionInfoRef = useRef<ConnectionInformation | null>(null);
  const contextValue = useMemo(() => ({ client, connectionInfoRef }), []);
  return (
    <ClientContext.Provider value={contextValue}>
      {children}
    </ClientContext.Provider>
  );
}
