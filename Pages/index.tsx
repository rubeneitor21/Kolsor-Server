import { CLIENT_RENEG_WINDOW } from "node:tls"
import React from "react"

type AppProps = {
    children?: React.ReactNode
}

export const App = ({ children }: AppProps) => {
    return (
        <>
            <div>Hola buenas tardes</div>
            <div id="ping"></div>

            <script src="game/main.js" />
        </>
    )
}