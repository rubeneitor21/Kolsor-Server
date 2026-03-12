import { IncomingMessage } from "http"
import React from "react"
import * as jwt from "jsonwebtoken";

type AppProps = {
  children?: React.ReactNode,
  req?: IncomingMessage
}

export const App = ({ children, req }: AppProps) => {
  
  const cookieHeader = req?.headers.cookie
  const token = cookieHeader?.split(" ")[0]?.split("=")[1]

  let username;

  if (token) {
    const data = jwt.verify(token, process.env.JWT_SECRET || "temp1234") as any
    username =  data.username
  }
  
  return (
    <>
      <div>Hola buenas tardes {username || ""}</div>
      <div id="ping"></div>

      <input id="matchmaking-search" type="button" value="Buscar partida" />

      <script src="game/main.js" />
    </>
  )
}
