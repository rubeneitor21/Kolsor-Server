export { }

declare global {
  interface PlayerState {
    energy: number;
    life: number;
    selectedRolls: DiceResult[];
    godFavor: string;        // TODO: reemplazar string por GodFavorType cuando esté definido
  }

  type RoomPhase = {
    state: "select-rolls" | "not-started" | "god-favor" | "game-over";
    round: 1 | 2 | 3 | 0;
    activePlayer: string;
    users: Record<string, PlayerState>;
    winner?: string
  }

  type Room = {
    "users": Map<string, WebSocket>,
    "state": string // Cambiar por enum
    "private": boolean,
    "code": string, // Codigo para partidas privadas, por defecto igual que id
    "starting": boolean
  }
}
