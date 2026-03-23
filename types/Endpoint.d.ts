export { };
declare global {
  type EndpointResponse = {
    body?: string | Object,
    status: number = 200,
    headers?: Record<string, string>
  }

  type EndPointCommand = (url: string, req: IncomingMessage) => EndpointResponse | Promise<EndpointResponse>;
  type Endpoint = Record<string, EndPointCommand>
}
