"use client"

import { useMemo } from "react"
import { Identity } from "spacetimedb"
import { SpacetimeDBProvider } from "spacetimedb/react"
import { DbConnection, ErrorContext } from "@/lib/module_bindings"

const HOST =
  process.env.NEXT_PUBLIC_SPACETIMEDB_HOST ?? "https://maincloud.spacetimedb.com"
const DB_NAME = process.env.NEXT_PUBLIC_SPACETIMEDB_DB_NAME ?? "huddles-5eq44"
const TOKEN_KEY = `${HOST}/${DB_NAME}/auth_token`

function buildConnectionBuilder() {
  const onConnect = (_conn: DbConnection, identity: Identity, token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
    console.log("Connected to SpacetimeDB with identity:", identity.toHexString())
  }

  const onDisconnect = () => {
    console.log("Disconnected from SpacetimeDB")
  }

  const onConnectError = (_ctx: ErrorContext, err: Error) => {
    console.log("Error connecting to SpacetimeDB:", err)
  }

  return DbConnection.builder()
    .withUri(HOST)
    .withDatabaseName(DB_NAME)
    .withToken(localStorage.getItem(TOKEN_KEY) || undefined)
    .onConnect(onConnect)
    .onDisconnect(onDisconnect)
    .onConnectError(onConnectError)
}

export function SpacetimeDBAppProvider({ children }: { children: React.ReactNode }) {
  const connectionBuilder = useMemo(() => {
    if (typeof window === "undefined") return DbConnection.builder().withUri(HOST).withDatabaseName(DB_NAME)
    return buildConnectionBuilder()
  }, [])

  return <SpacetimeDBProvider connectionBuilder={connectionBuilder}>{children}</SpacetimeDBProvider>
}
