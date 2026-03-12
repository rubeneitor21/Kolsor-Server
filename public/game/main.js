(() => {

  const jwt = document.cookie.split(" ")[0].split("=")[1]

  if (!jwt) {
    window.location.assign("/auth/login")
  }

  let ws //= new WebSocket("wss://" + window.location.host)
  let authed = false

  let intervalId;

  const searchButton = document.querySelector("#matchmaking-search")

  function initializeWS() {
    ws.onopen = () => {
      intervalId = setInterval(() => {
        ws.send(JSON.stringify({
          type: "ping",
          body: Date.now()
        }))
      }, 5000)

      ws.send(JSON.stringify({
        type: "auth",
        body: {
          "jwt": jwt
        }
      }))
    }

    ws.onmessage = (msg) => {
      let data = JSON.parse(msg.data)
      
      if (data.type != "pong")
        console.log(data)

      if (data.type === "pong") {
        // console.log(data.body)
        document.querySelector("#ping").textContent = (Date.now() - data.body) + "ms"
      }

      if (data.type === "matchmaking-join") {
        searchButton.value = data.body.message
        console.log(data.body)
      }

      if (data.type === "auth") {
        authed = true
      }
    }

    ws.onclose = () => {
      console.log("Conexion cerrada")
      clearInterval(intervalId)
    }
  }

  searchButton.addEventListener("click", async () => {
    searchButton.setAttribute("disabled", true)
    ws = new WebSocket("wss://" + window.location.host)
    initializeWS()

    searchButton.value = "Conectando"

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject("Timeout connecting to ws"), 3000)

      const interval = setInterval(() => {
        if (authed) {
          clearInterval(interval)
          clearTimeout(timeout)
          resolve()
        }
      }, 10)
    })

    console.log("Buscando partida")
    searchButton.value = "Buscando partida"

    ws.send(JSON.stringify({
      type: "matchmaking-search",
      body: {}
    }))
  })
})()
