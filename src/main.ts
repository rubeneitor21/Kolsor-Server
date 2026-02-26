import * as http from "node:http"
import { WebSocketServer } from "ws"

import {Logger} from "@utils/logger"

const PORT = process.env.PORT || 3000
const logger = new Logger()

const server = http.createServer((req, res) => {
    console.log(req.url)

    res.end("De momento nada socio")
}).listen(PORT)

server.on("listening", () => {
    if (process.env.NODE_ENV === "production") {
        console.log("Server listening on port" + PORT)
    }
    else {
        logger.info("Server listening on port" + PORT)
    }
})

const ws = new WebSocketServer({server})