import Logger from "@utils/logger"
import { Database } from "@utils/database"
import { IncomingMessage } from "node:http"

import { parseJSONBody } from "@utils/httpMessages"

const logger = Logger.getLogger()
const db = Database.getDatabase()

export default {
  "POST": async (url: string, req: IncomingMessage): Promise<EndpointResponse> => {
    
    const user = await parseJSONBody(req)
    
    const r = await db.createUser(user)
    
    if (r?.success) {
      return {
        body: {
          id: r.id
        },
        status: 200
      }
    }

    else {
      return {
        body: {
          error: r?.error
        },
        status: 400
      }
    }
  }
} as Endpoint
