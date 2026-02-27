import { Logger } from "@utils/logger"

let pings = new Map<string, NodeJS.Timeout>()

function closeTimeout(uuid: string, clients: Map<string, WebSocket>) {
    const ws = clients.get(uuid)

    ws?.send(JSON.stringify({
        type: "closing",
        body: "Closing due to timeout"
    }))

    ws?.close()

    clients.delete(uuid)
}

export function processCommand(data: any, clients: Map<string, WebSocket>, logger: Logger) {
    if (data.type === "connection") {
        pings.set(data.from, setTimeout(() => {
            closeTimeout(data.from, clients)
        }, 6000))
    }

    else if (data.type === "ping") {
        clearTimeout(pings.get(data.from))

        const ws = clients.get(data.from)

        ws?.send(JSON.stringify({
            type: "pong",
            body: Date.now()
        }))

        pings.set(data.from, setTimeout(() => {
            closeTimeout(data.from, clients)
        }, 6000))
    }
    else {
        logger.info(`Unknow command: ${data.type} from ${data.from}`)
    }
}