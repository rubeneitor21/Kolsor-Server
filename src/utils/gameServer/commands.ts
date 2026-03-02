import { Logger } from "@utils/logger"

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

    "connection": (data, clients) => {
        pings.set(data.from, setTimeout(() => {
            closeTimeout(data.from, clients);
        }, 6000));
    }
};


export function processCommand(data: CommandData, clients: Map<string, WebSocket>) {
    const handler = commands[data.type]

    if (handler) {
        handler(data, clients);
    } else {
        logger.info(`Unknown command: ${data.type} from ${data.from}`);
    }
}