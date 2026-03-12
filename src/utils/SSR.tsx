import { renderToString } from "react-dom/server"
import { Layout } from "@components/Layout"
import { readFileSync, existsSync } from "node:fs"
import mime from "mime-types"
import { IncomingMessage } from "node:http";
import Logger from "./logger";
import { join } from "node:path"

const logger = Logger.getLogger()

function urlToSegments(url: string) {
  // Sanetizar esta mierda para el public xdd
  const cleanUrl = url.split(/[?#]/)[0] || "";

  const segments = cleanUrl.match(/[^\/]+/g);

  return segments ?? [];
}

let routeMap: any = null;
try {
    routeMap = require("../routeMap");
} catch (e) { }

export async function loadPage(url: string, req: IncomingMessage): Promise<FrontResponse> {

    const segments = urlToSegments(url || "")
    let page;

    if (url === "/") {
        page = routeMap?.PagesMap?.["index"] || await import("@pages/index")
    }

    else if (url.startsWith("/api/")) {
        let apiSegments = segments.filter((_, i) => i != 0)
        const apiRoute = apiSegments.join("/")
        
        logger.info("ApiSegments: Api/" + apiRoute + ".ts")

        req.method = req.method ?? ""

        const apiModule = routeMap?.ApisMap?.[apiRoute] || 
                         (existsSync(`Api/${apiRoute}.ts`) ? await import(`@apis/${apiRoute}`) : null);

        if (apiModule) {
            let api: Endpoint = apiModule.default
            let endpoint: EndPointCommand | undefined = api[req.method]

            if (endpoint) {
                let respose = await endpoint(url, req)
                return { data: JSON.stringify(respose.body) || "", status: respose.status, type: "application/json" }
            }

            else {
                return { data: "{\"Error\": 405}", status: 405, type: "application/json" }
            }
        }
    }

    else {
        const pageRoute = segments.join("/")
        
        const pageModule = routeMap?.PagesMap?.[pageRoute] || 
                          (existsSync(`Pages/${pageRoute}.tsx`) ? await import(`@pages/${pageRoute}`) : null);
        
        if (pageModule) {
            page = pageModule
        }
        
        else if (existsSync(`public/${segments.join("/")}`)) {
            const data = readFileSync(`public/${segments.join("/")}`)
            const type = mime.lookup(`public/${segments.join("/")}`) || "text/plain"
            return { data, status: 200, type }
        }
    }

    if (!page) {
        page = routeMap?.PagesMap?.["404"] || await import("@pages/404")
        const App = page.App
        const html = renderToString(<Layout><App /></Layout>)
        return { data: html, status: 404, type: "text/html" }
    }

    const App = page.App
    const html = renderToString(<Layout><App req={req} /></Layout >)

    return { data: html, status: 200, type: "text/html" }
}
