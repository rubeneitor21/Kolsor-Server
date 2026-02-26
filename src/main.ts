import * as http from "node:http"
import { WebSocketServer } from "ws"

import { randomUUID } from "node:crypto"

import { Logger } from "@utils/logger"
import { loadPage } from "@utils/SSR"



const PORT = process.env.PORT || 3000
const logger = new Logger()

const server = http.createServer(async (req, res) => {
    const response = await loadPage(req.url || "")

    logger.info(req.url + " - " + response.status)

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

    logger.info(`Client connected: ${uuid}`)

    // let timeoutId = setTimeout(() => {
    //     clients.delete(uuid)
    //     ws.close()
    // }, 5000)

    ws.onmessage = (d: MessageEvent) => {
        let msg = JSON.parse(d.data)
        logger.info(`Type: ${msg.type}, data: ${msg.data}`)
    }

    ws.onclose = (e: CloseEvent) => {
        logger.info(`Client disconnected: ${uuid}`)
    }
})