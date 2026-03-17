export { }
declare global {
  interface CommandData {
    type: string;
    from: string;
    body?: any;
  }

  type CommandHandler = (data: CommandData, clients: Map<string, WebSocket>) => void | string;
}
