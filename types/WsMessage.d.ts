export { };
declare global {
    enum WsMessageType {
        "ping"
    }

    interface WsMessage {
        type: WsMessageType,
        data: Object
    }
}