import React from "react"

type AppProps = {
    children?: React.ReactNode
}

export const App = ({ children }: AppProps) => {
    return (
        <>
            <input id="user" type="text" placeholder="Usuario" />
            <input id="password" type="password" placeholder="Contraseña" />

            <input id="login" type="button" value="Iniciar sesion" />

            <script src="/auth/login.js" />
        </>
    )
}
