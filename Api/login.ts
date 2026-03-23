import Logger from "@utils/logger"
import { Database } from "@utils/database"
import { parseJSONBody, validateFields } from "@utils/httpMessages"
import { IncomingMessage } from "node:http"

const logger = Logger.getLogger()
const db = Database.getDatabase()

export default {
  "POST": async (url: string, req: IncomingMessage): Promise<EndpointResponse> => {

    const credentials = await parseJSONBody(req).catch(() => null)

    const error = !credentials ? "Body invalido" : validateFields(credentials, ["username", "password"])
    if (error) return { body: { error }, status: 401 }

    const r = await db.loginUser(credentials);

    if (r?.success) {
      const cookie = [
        `token=${r.token}`,
        "HttpOnly",
        "SameSite=Strict",
        process.env.NODE_ENV === "production" ? "Secure" : "",
        "Path=/",
        "Max-Age=86400"
      ].filter(Boolean).join("; ")

      return {
        body: {
          token: r.token,
          user: r.user
        },
        status: 200,
        headers: {"Set-Cookie": cookie}
      };
    } else {
      return {
        body: { error: r?.error },
        status: 401
      };
    }
  }
} as Endpoint
