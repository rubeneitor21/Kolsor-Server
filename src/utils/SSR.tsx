import { renderToString } from "react-dom/server"
import { Layout } from "@components/Layout"
import { readFileSync, existsSync } from "node:fs"
import mime from "mime-types"

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

export async function loadPage(url: string): Promise<Response> {

    const segments = urlToSegments(url || "")

    let page;

    if (url === "/") {
        page = await import("@pages/index")
    }

    // Apis
    // else if (url === "/api") { }

    else if (existsSync(`Pages/${segments.join("/")}.tsx`)) {
        page = await import(`@pages/${segments.join("/")}`)
    }

    else if (existsSync(`public/${segments.join("/")}`)) {
        const data = readFileSync(`public/${segments.join("/")}`)
        const type = mime.lookup(`public/${segments.join("/")}`) || "text/plain"
        return { data, status: 200, type }
    }

    if (!page) {
        const html = renderToString(<Layout>404 </Layout>)
        return { data: html, status: 404, type: "text/html" }
    }

    const App = page.App

    const html = renderToString(<Layout><App /></Layout >)

    return { data: html, status: 200, type: "text/html" }
}