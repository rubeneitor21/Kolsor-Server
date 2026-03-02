export { }

declare global {
    type FrontResponse = {
        data: string | NonSharedBuffer,
        status: number,
        type: string
    }
}