import React from "react"

export const Layout = ({ children }: { children: React.ReactNode }) => (
    <html lang="es">
        <head>
            <meta charSet="UTF-8" />
            <title>Kolsor</title>
        </head>
        <body>
            <div id="root">{children}</div>
        </body>
    </html>
);