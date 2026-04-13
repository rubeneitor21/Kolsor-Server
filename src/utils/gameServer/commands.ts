import { Logger } from "@utils/logger"
import { DiceRNG } from "@utils/gameServer/dice"
import { randomUUID } from "node:crypto"
import * as jwt from "jsonwebtoken";
import { Database } from "@utils/database";
import { ObjectId } from "mongodb";
import { KolsorFace } from "@utils/gameServer/dice";

let pings = new Map<string, NodeJS.Timeout>()
let logger: Logger = Logger.getLogger()

const db: Database = Database.getDatabase();

class Room {
  private id: string;
  private users: Map<string, WebSocket> = new Map();
  private state: any = {
    "state": "not-started"
  };
  private private: boolean = false;
  private code: string = "";
  private rng!: DiceRNG;

  private usersInfo: Map<String, any> = new Map();

  private playerStart: string = ""
  private playerSecond: string = ""

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

  public updateRolls(user: string, rolls: any) {
    if (this.state.activePlayer != user || this.state.state != "select-rolls") return;

    // Deberia verificar que los dados esten en la pool

    this.state.users[user].selectedRolls.push(rolls)

    let totalSelects = 0;
    this.users.forEach((_v, user) => {
      totalSelects += this.state.users[user].selectedRolls.length
    })

    if (totalSelects == 12) this.godFavor()
    else {
      if (this.state.activePlayer === this.playerSecond) {
        if (this.state.round === 3) {
          this.godFavor()
        }
        else this.state.round++
      }
      this.state.activePlayer = this.state.activePlayer === this.playerStart ? this.playerSecond : this.playerStart

      const newRolls: any = {
        body: {}
      }

      newRolls.body.rolls = this.rng.getRolls(6 - (this.state?.users[this.state.activePlayer].selectedRolls.length || 0))
      newRolls.user = this.state.activePlayer
      newRolls.state = this.state;

      this.broadcast("game-rolls", newRolls)
    }
  }

  private godFavor() {
    this.state.state = "god-favor"
    this.state.rounds = 0

    const data: any = {
      body: {
        "state": this.state
      }
    }

    this.broadcast("god-favor", data)
  }

  public updateGodFavor(user: string, favor: string) {
    if (this.state.state != "god-favor") return;

    this.state.users[user].godFavor = favor

    let seleccionados = true
    this.users.forEach((_v, user1) => {
      seleccionados = this.state.users[user1].godFavor != ""
    })

    if (seleccionados) {
      this.resolution()
    }
  }

  private resolution() {
    // Activar favores

    // Parsear dados 
    let resolutionState: any = {}

    this.users.forEach((_v, user) => {
      resolutionState[user] = {
        aDistancia: 0,
        dDistancia: 0,
        aMelee: 0,
        dMelee: 0,
        steal: 0
      }
      this.state.users[user].selectedRolls.forEach((roll: any) => {
        if (roll.energy) this.state.users[user].energy++

        if (roll.face == KolsorFace.AXE) resolutionState[user].aMelee++
        else if (roll.face == KolsorFace.ARROW) resolutionState[user].aDistancia++
        else if (roll.face == KolsorFace.SHIELD) resolutionState[user].dMelee++
        else if (roll.face == KolsorFace.HELMET) resolutionState[user].dDistancia++

        else if (roll.face == KolsorFace.HAND) resolutionState[user].steal++
      });
    })

    // atacar

    // Primero
    let energySteal = Math.min(this.state.users[this.playerSecond].energy, resolutionState[this.playerStart].steal)
    this.state.users[this.playerSecond].energy -= energySteal
    this.state.users[this.playerStart].energy += energySteal

    let damageDistancia = Math.max(0, resolutionState[this.playerStart].aDistancia - resolutionState[this.playerSecond].dDistancia)
    let damageMelee = Math.max(0, resolutionState[this.playerStart].aMelee - resolutionState[this.playerSecond].dMelee)

    this.state.users[this.playerSecond].life -= (damageDistancia + damageMelee)

    this.broadcast("resolution-attack-first", {
      body: { "state": this.state }
    })

    if (this.state.users[this.playerSecond].life <= 0) {
      this.broadcast("game-over", {
        body: {winner: this.playerStart}
      })
      return
    }

    // Segundo
    energySteal = Math.min(this.state.users[this.playerStart].energy, resolutionState[this.playerSecond].steal)
    this.state.users[this.playerStart].energy -= energySteal
    this.state.users[this.playerSecond].energy += energySteal

    damageDistancia = Math.max(0, resolutionState[this.playerSecond].aDistancia - resolutionState[this.playerStart].dDistancia)
    damageMelee = Math.max(0, resolutionState[this.playerSecond].aMelee - resolutionState[this.playerStart].dMelee)

    this.state.users[this.playerStart].life -= (damageDistancia + damageMelee)

    this.broadcast("resolution-attack-second", {
      body: { "state": this.state }
    })

    if (this.state.users[this.playerStart].life <= 0) {
      this.broadcast("game-over", {
        body: {winner: this.playerSecond}
      })
      return
    }

    this.state.state = "select-rolls"
    this.state.round = 0

    this.users.forEach((_v, user) => {
      this.state.users[user].selectedRolls = []
      this.state.users[user].godFavor = ""
    })

    const tempPlayer = this.playerStart
    this.playerStart = this.playerSecond
    this.playerSecond = tempPlayer

    const newRolls: any = {
      body: {}
    }

    newRolls.body.rolls = this.rng.getRolls(6 - (this.state?.users[this.state.activePlayer].selectedRolls.length || 0))
    newRolls.user = this.state.activePlayer
    newRolls.state = this.state;

    this.broadcast("game-rolls", newRolls)
  }

  private startGame() {
    const playerStartIndex = this.rng.getStart()

    const users = this.users.keys()

    this.playerStart = users.find((_key, i) => i == playerStartIndex) || ""
    this.playerSecond = users.find(key => key !== this.playerStart) || ""

    let playerInfo: any = []

    this.usersInfo.forEach((v, k) => {
      playerInfo.push({
        id: k,
        username: v.username
      })
    })

    const data = {
      body: {
        playerStart: this.playerStart,
        players: playerInfo
      }
    }

    const rolls: any = {
      body: {}
    }

    rolls.body.rolls = this.rng.getRolls(6 - (this.state?.users[this.state.activePlayer]?.selectedRolls?.length || 0))
    rolls.user = this.playerStart

    let usersState: any = {}
    this.users.forEach((_v, user) => {
      usersState[user] = {
        "energy": 0,
        "life": 15,
        "selectedRolls": [],
        "godFavor": ""
      }
    })

    this.broadcast("game-start", data)
    this.broadcast("game-rolls", rolls)

    this.state = {
      "state": "select-rolls",
      "round": 1,
      "users": usersState,
      "activePlayer": this.playerStart
    }
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
const clientsRoom: Map<string, Room> = new Map() // Es un poco de duplicar pero al final hace las busquedas mas rapidas y queda mas limpio

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
    for (const [id, room] of rooms) {
      if (!room.isPublic() || room.getUsersLength() == 2) continue
      roomFound = true
      await room.addUser(data.from, ws!)
      clientsRoom.set(data.from, room)
      break
    }

    if (!roomFound) {
      const room = new Room()

      rooms.set(room.getId(), room)

      clientsRoom.set(data.from, room)

      await room.addUser(data.from, ws!)
    }
  },

  // partida
  "select-rolls": (data, clients) => {
    const room = clientsRoom.get(data.from)
    if (!room) return

    room.updateRolls(data.from, data.body.rolls)
  },

  "select-favor": (data, clients) => {
    const room = clientsRoom.get(data.from)
    if (!room) return

    room.updateGodFavor(data.from, data.body.favor)
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
