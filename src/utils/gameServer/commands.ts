import { Logger } from "@utils/logger"
import { DiceRNG } from "@utils/gameServer/dice"
import { randomUUID } from "node:crypto"
import * as jwt from "jsonwebtoken";
import { Database } from "@utils/database";
import { ObjectId } from "mongodb";

let pings = new Map<string, NodeJS.Timeout>()
let logger: Logger = Logger.getLogger()

const db: Database = Database.getDatabase();

class Room {
  private id: string;
  private users: Map<string, WebSocket> = new Map();
  private state: string = "";
  private private: boolean = false;
  private code: string = "";
  private rng!: DiceRNG;

  private usersInfo: Map<String, any> = new Map();

  constructor(code?: string) {
    this.id = randomUUID()

    if (code) this.private = true

    this.code = code ?? this.id
  }

  private initRNG() {
    const seed = [...this.users.keys()].reduce((total, current) => total + current) + this.id

    this.rng = new DiceRNG(seed, this.id)
  }

  public async addUser(id: string, ws: WebSocket) {
    this.users.set(id, ws)

    const info = (ObjectId.isValid(id) && await db.getUser(id)) || null

    this.usersInfo.set(id, info)

    ws.send(JSON.stringify({
      type: "matchmaking-join",
      body: { "id": id, "message": this.getUsersLength() == 1 ? "Creando partida" : "Uniendose a partida" }
    }))

    if (this.getUsersLength() == 2) {
      this.initRNG()

      this.startGame()
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

  private broadcast(type: string, data: any) {
    data.type = type

    this.users.forEach((ws, id) => {
      ws.send(JSON.stringify(data))
    })
  }

  private startGame() {
    const playerStartIndex = this.rng.getStart()

    const users = this.users.keys()

    const playerStart = users.find((_key, i) => i == playerStartIndex)

    let playerInfo:any = []

    this.usersInfo.forEach((v,k) => {
      playerInfo.push({
        id: k,
        username: v.username
      })
    })

    const data = {
      body: {
        playerStart: playerStart,
        players: playerInfo
      }
    }

    const rolls: any = {
      body: {}
    }

    this.usersInfo.forEach((v,k: any) => {
      rolls.body[k] = this.rng.getRolls(10)
    })
  
    this.broadcast("game-start", data)
    this.broadcast("game-rolls", rolls)
  }
}

function closeTimeout(uuid: string, clients: Map<string, WebSocket>) {
  const ws = clients.get(uuid)

  ws?.send(JSON.stringify({
    type: "closing",
    body: "Closing due to timeout"
  }))

  ws?.close()

  pings.delete(uuid)

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
      tokenData = jwt.verify(token, process.env.JWT_SECRET!) as any
    } catch (e) {
      ws?.send(JSON.stringify({
        type: "closing",
        body: "Closing due invalid token"
      }))

      ws?.close()

      clients.delete(data.from)
      return
    }

    ws?.send(JSON.stringify({
      type: "auth",
      body: JSON.stringify(tokenData)
    }))

    clients.delete(data.from)
    clients.set(tokenData.id, ws!)

    clearTimeout(pings.get(data.from))

    pings.delete(data.from)

    pings.set(tokenData.id, setTimeout(() => {
      closeTimeout(tokenData.id, clients);
    }, 6000));

    return tokenData.id
  },

  "connection": (data, clients) => {
    pings.set(data.from, setTimeout(() => {
      closeTimeout(data.from, clients);
    }, 6000));
  },

  "matchmaking-search": async (data, clients) => {
    const ws = clients.get(data.from)

    ws?.send(JSON.stringify({
      type: "matchmaking-search",
      body: "Buscando partida"
    }))

    let roomFound = false;
    rooms.forEach(async (room, id) => {
      if (!room.isPublic()) return
      if (room.getUsersLength() == 2) return

      roomFound = true
      // ws?.send(JSON.stringify({
      //   type: "matchmaking-join",
      //   body: { "id": id, "message": "Uniendose a partida" }
      // }))

      await room.addUser(data.from, ws!)

      clientsRoom.set(data.from, id) 
    })

    if (!roomFound) {
      const room = new Room()

      await room.addUser(data.from, ws!)

      rooms.set(room.getId(), room)

      clientsRoom.set(data.from, room.getId())
    }
  }
};


export function processCommand(data: CommandData, clients: Map<string, WebSocket>) {
  const handler = responseCommands[data.type]

  if (handler) {
    return handler(data, clients);
  } else {
    logger.warning(`Unknown command: ${data.type} from ${data.from}`);
  }
}
