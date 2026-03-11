export { }

declare global {
    type Room = {
        "users": Map<string, WebSocket>,
        "state": string // Cambiar por enum
        "private": boolean,
        "code": string // Codigo para partidas privadas, por defecto igual que id
    }
}