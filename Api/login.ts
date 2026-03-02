import Logger from "@utils/logger"

const logger = Logger.getLogger()

export default {
    "GET": (): EndpointResponse => {
        logger.info("Hola, Api")

        return {
            body: {
                "ok": true
            },
            status: 200
        }
    }
} as Endpoint