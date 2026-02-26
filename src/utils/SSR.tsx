import { renderToString } from "react-dom/server"
import { Layout } from "@components/Layout"
import { readFileSync, existsSync } from "node:fs"

function urlToSegments(url: string) {
    // Sanetizar esta mierda para el public xdd
    const cleanUrl = url.split(/[?#]/)[0] || "";

    const segments = cleanUrl.match(/[^\/]+/g);

    return segments ?? [];
}

type Response = {
    data: string,
    status: number,
    type: "text/html" | "application/json"
}

export async function loadPage(url: string): Promise<Response> {

    const segments = urlToSegments(url || "")

    if (url === "/") {
        const page = await import("@pages/index")
        const App = page.App

        const html = renderToString(<Layout><App /></Layout >)

        return { data: html, status: 200, type: "text/html" }
    }

    // Apis
    // else if (url === "/api") { }

    else if (existsSync(`Pages/${segments.join("/")}.tsx`)) {

        const page = await import(`@pages/${segments.join("/")}`)
        const App = page.App

        const html = renderToString(<Layout><App /></Layout >)

        return { data: html, status: 200, type: "text/html" }
    }

    else {
        // Carpeta public
    }

    const html = renderToString(<Layout>404 </Layout>)
    return { data: html, status: 404, type: "text/html" }
}