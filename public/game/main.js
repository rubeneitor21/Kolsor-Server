(() => {
    const ws = new WebSocket("wss://" + window.location.host)

    let intervalId;

    ws.onopen = () => {
        intervalId = setInterval(() => {
            ws.send(JSON.stringify({
                type: "ping",
                body: Date.now()
            }))
        }, 5000)
    }

    ws.onmessage = (msg) => {
        let data = JSON.parse(msg.data)

        console.log(data)

        if (data.type === "pong") {
            // console.log(data.body)
            document.querySelector("#ping").textContent = (Date.now() - data.body) + "ms"
        }

        if (data.type === "matchmaking-join") {
            console.log(data.body)
        }
    }

    ws.onclose = () => {
        clearInterval(intervalId)
    }

    document.querySelector("#matchmaking-search").addEventListener("click", () => {
        console.log("Buscando partida")

        ws.send(JSON.stringify({
            type: "matchmaking-search",
            body: {}
        }))
    })
})()