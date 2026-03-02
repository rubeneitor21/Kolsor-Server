import { renderToString } from "react-dom/server"
import { Layout } from "@components/Layout"
import { readFileSync, existsSync } from "node:fs"
import mime from "mime-types"
import { IncomingMessage } from "node:http";
import Logger from "./logger";

const logger = Logger.getLogger()

function urlToSegments(url: string) {
    // Sanetizar esta mierda para el public xdd
    const cleanUrl = url.split(/[?#]/)[0] || "";

    const segments = cleanUrl.match(/[^\/]+/g);

    return segments ?? [];
}

type Response = {
    data: string | NonSharedBuffer,
    status: number,
    type: string
}

export async function loadPage(url: string, req: IncomingMessage): Promise<Response> {

    const segments = urlToSegments(url || "")

    let page;

    if (url === "/") {
        page = await import("@pages/index")
    }

    // Apis
    else if (url.startsWith("/api/")) {
        let apiSegments = segments.filter((_, i) => i != 0)
        logger.info("ApiSegments: Api/" + apiSegments.join("/") + ".ts")

        req.method = req.method ?? ""

        if (existsSync(`Api/${apiSegments.join("/")}.ts`)) {
            let apiImport = await import(`@apis/${apiSegments.join("/")}`)

            let api: Endpoint = apiImport.default
            let endpoint: EndPointCommand | undefined = api[req.method]

            if (endpoint) {
                let respose = endpoint(url, req)
                return { data: respose.body || "", status: respose.status, type: "application/json" }
            }

            else {
                return { data: "{\"Error\": 405}", status: 405, type: "application/json" }
            }
        }

        else {
        }
        // return {data: response.data, status: response.status, "application/json" }
    }

    else if (existsSync(`Pages/${segments.join("/")}.tsx`)) {
        page = await import(`@pages/${segments.join("/")}`)
    }

    else if (existsSync(`public/${segments.join("/")}`)) {
        const data = readFileSync(`public/${segments.join("/")}`)
        const type = mime.lookup(`public/${segments.join("/")}`) || "text/plain"
        return { data, status: 200, type }
    }

    if (!page) {
        page = await import("@pages/404")
        const App = page.App
        const html = renderToString(<Layout><App /></Layout>)
        return { data: html, status: 404, type: "text/html" }
    }

    const App = page.App

    const html = renderToString(<Layout><App /></Layout >)

    return { data: html, status: 200, type: "text/html" }
}