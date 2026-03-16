import React from "react"

export const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <html lang="es">
            <head>
                <meta charSet="UTF-8" />
                <title>Kolsor</title>
                <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png"></link>
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png"></link>
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png"></link>
                <link rel="shortcut icon" href="favicon/favicon.ico" type="/image/x-icon" />
                {/* <link rel="manifest" href="/site.webmanifest"></link> */}
                <link rel="stylesheet" href="/style.css" />
                <meta name="generator" content="WavePage" />
            </head>
            <body>
                <div id="root">{children}</div>
            </body>
        </html>
    )
};
