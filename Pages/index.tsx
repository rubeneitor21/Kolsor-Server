import { IncomingMessage } from "http"
import React from "react"
import * as jwt from "jsonwebtoken";
import { Game } from "@components/Game";

type AppProps = {
  children?: React.ReactNode,
  req?: IncomingMessage
}

export const App = ({ children, req }: AppProps) => {

  const cookieHeader = req?.headers.cookie
  const token = cookieHeader?.split("; ").find(c => c.startsWith("token="))?.split("=")[1]

  let username;
  let id;

  if (token) {
    try {
      const data = jwt.verify(token, process.env.JWT_SECRET!) as any
      username = data.username
      id = data.id
    } catch { }
  }

  return (
    <>
      <div id="username" hidden={true} >{username}</div>
      <div id="id" hidden={true} >{id}</div>
      <div>Hola buenas tardes {username || ""}</div>
      <div id="ping"></div>

      <input id="matchmaking-search" type="button" value="Buscar partida" />
      <div id="players"></div>
      <div id="rolls"></div>

      <Game />
    </>
  )
}
