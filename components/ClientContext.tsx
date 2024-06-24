import { Client } from "archipelago.js";
import React, { ReactNode, createContext, useContext, useMemo } from "react";

/**
 * Used to get the client from the context using useContext(ClientContext)
 */
export const ClientContext = createContext(new Client());

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
  return (
    <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
  );
}
