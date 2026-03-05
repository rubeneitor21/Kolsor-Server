export { };
declare global {
    type EndpointResponse = {
        body?: string | Object,
        status: number = 200
    }

    type EndPointCommand = (url: string, req: IncomingMessage) => EndpointResponse | Promise<EndpointResponse>;
    type Endpoint = Record<string, EndPointCommand>
}
