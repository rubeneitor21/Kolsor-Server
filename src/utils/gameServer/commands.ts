import { Logger } from "@utils/logger"
import { randomUUID } from "node:crypto"
import * as jwt from "jsonwebtoken";

let pings = new Map<string, NodeJS.Timeout>()
let logger: Logger = Logger.getLogger()

function closeTimeout(uuid: string, clients: Map<string, WebSocket>) {
  const ws = clients.get(uuid)

  ws?.send(JSON.stringify({
    type: "closing",
    body: "Closing due to timeout"
  }))

  ws?.close()

  clients.delete(uuid)
}

const rooms: Map<string, Room> = new Map()

const commands: Record<string, CommandHandler> = {
  "ping": (data, clients) => {
    clearTimeout(pings.get(data.from));

    const ws = clients.get(data.from);
    ws?.send(JSON.stringify({
      type: "pong",
      body: Date.now()
    }));

    pings.set(data.from, setTimeout(() => {
      closeTimeout(data.from, clients);
    }, 6000));
  },

  "auth": (data, clients) => {
    const ws = clients.get(data.from)

    if (!data.body.jwt) {
      ws?.send(JSON.stringify({
        type: "closing",
        body: "Closing due to no token"
      }))

      ws?.close()

      clients.delete(data.from)
      return
    }
    const token = data.body.jwt
    let tokenData

    try {
      tokenData = jwt.verify(token, process.env.JWT_SECRET || "temp1234")
    } catch (e) {
      ws?.send(JSON.stringify({
        type: "closing",
        body: "Closing due invalid token"
      }))

      ws?.close()

      clients.delete(data.from)
    }

    ws?.send(JSON.stringify({
      type: "auth",
      body: JSON.stringify(tokenData)
    }))
  },

  "connection": (data, clients) => {
    pings.set(data.from, setTimeout(() => {
      closeTimeout(data.from, clients);
    }, 6000));
  },

  "matchmaking-search": (data, clients) => {
    const ws = clients.get(data.from)

    ws?.send(JSON.stringify({
      type: "matchmaking-search",
      body: "Buscando partida"
    }))

    let roomFound = false;
    rooms.forEach((room, id) => {
      if (room.private) return
      if (room.users.size == 2) return

      roomFound = true
      ws?.send(JSON.stringify({
        type: "matchmaking-join",
        body: { "id": id, "message": "Uniendose a partida" }
      }))
    })

    if (!roomFound) {
      const room: Room = {
        users: new Map(),
        state: "waitingPlayers",
        private: false,
        code: randomUUID()
      }

      room.users.set(data.from, ws!)

      rooms.set(room.code, room)

      ws?.send(JSON.stringify({
        type: "matchmaking-join",
        body: { "id": room.code, "message": "Creando partida" }
      }))
    }
  }
};


export function processCommand(data: CommandData, clients: Map<string, WebSocket>) {
  const handler = commands[data.type]

  if (handler) {
    handler(data, clients);
  } else {
    logger.warning(`Unknown command: ${data.type} from ${data.from}`);
  }
}
