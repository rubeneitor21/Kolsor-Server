import Logger from "@utils/logger"

const logger = Logger.getLogger()

export default {
    "GET": (): EndpointResponse => {
        logger.info("Hola, Api")

        return {
            status: 200
        }
    }
} as Endpoint