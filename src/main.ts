import * as http from "node:http"
import { WebSocketServer } from "ws"
import { randomUUID } from "node:crypto"
import { Logger } from "@utils/logger"
import { loadPage } from "@utils/SSR"
import { processCommand } from "@utils/gameServer/commands"
import { Database } from "@utils/database"
import * as jwt from "jsonwebtoken";

const PORT = process.env.PORT || 3000
const logger = Logger.getLogger()

const db = Database.getDatabase();

(async () => await db.init())()

const server = http.createServer(async (req, res) => {
  const response = await loadPage(req.url || "", req)

  logger.info(req.url + " - " + response.status + ` (${req.headers["x-forwarded-for"]})`)

  res.setHeader('Content-Type', response.type);
  res.statusCode = response.status
  res.end(response.data)
}).listen(PORT)

server.on("listening", () => {
  if (process.env.NODE_ENV === "production") {
    console.log("Server listening on port " + PORT)
  }
  else {
    logger.info("Server listening on port " + PORT)
  }
})

const wss = new WebSocketServer({ server })

const clients: Map<string, WebSocket> = new Map()

wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
  let token = req.headers.cookie?.split(" ")[0]?.split("=")[1]
  let data
  try {
    data = jwt.verify(token!, process.env.JWT_SECRET || "temp1234") as any
  }
  catch (e) { }

  let uuid = data?.id || randomUUID().toString()

  clients.set(uuid, ws)

  processCommand({ type: "connection", from: uuid }, clients)

  logger.info(`Client connected: ${uuid}`)

  ws.onmessage = (d: MessageEvent) => {
    let msg = JSON.parse(d.data) as CommandData

    msg.from = uuid
 
    let newuuid = processCommand(msg, clients)
    
    // De momento es el unico evento que devuelve algo
    if (typeof newuuid === "string") {
      logger.info(`Cliente autenticado: ${uuid} -> ${newuuid}`)
      uuid = newuuid
    }
  }

  ws.onclose = (_e: CloseEvent) => {
    clients.delete(uuid)
    logger.info(`Client disconnected: ${uuid}`)
  }
})
