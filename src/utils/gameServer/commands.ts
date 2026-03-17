import { Logger } from "@utils/logger"
import { randomUUID } from "node:crypto"
import * as jwt from "jsonwebtoken";
import { start } from "node:repl";
import { Database } from "@utils/database";

let pings = new Map<string, NodeJS.Timeout>()
let logger: Logger = Logger.getLogger()

const db: Database = Database.getDatabase();

class Room {
  private id: string;
  private users: Map<string, WebSocket> = new Map();
  private state: string = "";
  private private: boolean = false;
  private code: string = "";

  private usersInfo: Map<String, any> = new Map();

  constructor(code?: string) {
    this.id = randomUUID()

    if (code) this.private = true

    this.code = code ?? this.id
  }

  public async addUser(id: string, ws: WebSocket) {
    this.users.set(id, ws)

    const info = await db.getUser(id)

    this.usersInfo.set(id, info)

    ws.send(JSON.stringify({
      type: "matchmaking-join",
      body: { "id": id, "message": this.getUsersLength() == 1 ? "Creando partida" : "Uniendose a partida" }
    }))

    if (this.getUsersLength() == 2) {
      // this.startGame()
    }
  }

  public isPublic() {
    return !this.private
  }

  public getUsersLength() {
    return this.users.size
  }

  public getId() {
    return this.id;
  }

  private broadcast(type: string, data: string) {
    this.users.forEach((ws, id) => {
      ws.send(data) 
    })
  }

  private async startGame() {
    
    const data = {}
    this.broadcast("game-start", JSON.stringify(data))
  }
}

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
const clientsRoom: Map<string, string> = new Map() // Es un poco de duplicar pero al final hace las busquedas mas rapidas y queda mas limpio

const responseCommands: Record<string, CommandHandler> = {
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
      tokenData = jwt.verify(token, process.env.JWT_SECRET || "temp1234") as any
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

    clients.delete(data.from)
    clients.set(tokenData.id, ws!)

    return tokenData.id 
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
      if (!room.isPublic()) return
      if (room.getUsersLength() == 2) return

      roomFound = true
      // ws?.send(JSON.stringify({
      //   type: "matchmaking-join",
      //   body: { "id": id, "message": "Uniendose a partida" }
      // }))

      room.addUser(data.from, ws!)

      clientsRoom.set(data.from, id)
    })

    if (!roomFound) {
      const room = new Room()

      room.addUser(data.from, ws!)

      rooms.set(room.getId(), room)

      clientsRoom.set(data.from, room.getId())
    }
  }
};


export function processCommand(data: CommandData, clients: Map<string, WebSocket>) {
  const handler = responseCommands[data.type]

  if (handler) {
    handler(data, clients);
  } else {
    logger.warning(`Unknown command: ${data.type} from ${data.from}`);
  }
}
