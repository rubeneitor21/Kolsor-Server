import React from "react"
import { readFileSync } from "node:fs";

export const Layout = ({ children }: { children: React.ReactNode }) => {
    let css = "";

    try {
        css = readFileSync("public/style.css").toString()
    } catch { }

    return (
        <html lang="es">
            <head>
                <meta charSet="UTF-8" />
                <title>Kolsor</title>
                <style>
                    {css}
                </style>
            </head>
            <body>
                <div id="root">{children}</div>
            </body>
        </html>
    )
};