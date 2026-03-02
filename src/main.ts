import * as http from "node:http"
import { WebSocketServer } from "ws"
import { randomUUID } from "node:crypto"
import { Logger } from "@utils/logger"
import { loadPage } from "@utils/SSR"

import { processCommand } from "@utils/gameServer/commands"
import { matchesGlob } from "node:path"

const PORT = process.env.PORT || 3000
const logger = Logger.getLogger()

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

wss.on("connection", (ws: WebSocket, req: Request) => {
    let uuid = randomUUID().toString()

    clients.set(uuid, ws)

    processCommand({ type: "connection", from: uuid }, clients)

    logger.info(`Client connected: ${uuid}`)

    ws.onmessage = (d: MessageEvent) => {
        let msg = JSON.parse(d.data) as CommandData
        msg.from = uuid
        processCommand(msg, clients)
    }

    ws.onclose = (e: CloseEvent) => {
        clients.delete(uuid)
        logger.info(`Client disconnected: ${uuid}`)
    }
})