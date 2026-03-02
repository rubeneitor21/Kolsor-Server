export { };
declare global {
    type EndpointResponse = {
        body?: string | Object,
        status: number = 200
    }

    type EndPointCommand = (url: string, req: IncomingMessage) => EndpointResponse;
    type Endpoint = Record<string, EndPointCommand>
}