(() => {
  let ws //= new WebSocket("wss://" + window.location.host)
  let authed = false
  let currentRoom = null
  let userId = null
  let playerStart = null
  let players = []
  let activePlayer = null
  let selectedRolls = []

  const username = document.querySelector("#username").innerHTML
  const userIdElement = document.querySelector("#id")
  if (userIdElement) {
    userId = userIdElement.innerHTML
  }

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

      // ws.send(JSON.stringify({
      //   type: "auth",
      //   body: {
      //     "jwt": token
      //   }
      // }))
    }

    ws.onmessage = (msg) => {
      let data = JSON.parse(msg.data)
      
      if (data.type != "pong")
        console.log(data)

      if (data.type === "pong") {
        // console.log(data.body)
        document.querySelector("#ping").textContent = Math.abs(Date.now() - data.body) + "ms"
      }

      if (data.type === "matchmaking-join") {
        searchButton.value = data.body.message
        console.log(data.body)
      }

      if (data.type === "auth") {
        authed = true
      }

      if (data.type === "game-start") {
        currentRoom = data.body.roomId
        playerStart = data.body.playerStart
        players = data.body.players
        
        // Mostrar información de jugadores
        let playersDiv = document.querySelector("#players")
        playersDiv.innerHTML = ""
        
        players.forEach((p) => {
          if (p.id === userId) {
            playersDiv.innerHTML += `<div>${p.username} - Tu</div>`
          }
          else {
            playersDiv.innerHTML += `<div>${p.username}</div>`
          }
        })
        
        // Mostrar estado del juego
        document.querySelector("#game-state").textContent = "¡Partida iniciada!"
        
        // Mostrar las tiradas iniciales
        showRolls(data.body.rolls)
      }

      if (data.type === "game-rolls") {
        activePlayer = data.user;
        showRolls(data.body.rolls, data.user);
      }

      if (data.type === "god-favor") {
        showGodFavor()
      }

      if (data.type === "resolution-attack-first") {
        updateCombatLog("¡Ataque del primer jugador!")
        updatePlayerInfo(data.body.state)
      }

      if (data.type === "resolution-attack-second") {
        updateCombatLog("¡Ataque del segundo jugador!")
        updatePlayerInfo(data.body.state)
      }

      if (data.type === "game-over") {
        showGameOver(data.body.winner)
      }
    }

    ws.onclose = () => {
      console.log("Conexion cerrada")
      clearInterval(intervalId)
    }
  }

  function showRolls(rolls, user) {
    let rollsDiv = document.querySelector("#rolls")
    rollsDiv.innerHTML = "<br>Tiradas:<br>"
    
    // Si no es el jugador activo, mostrar mensaje de espera
    if (user !== userId) {
      rollsDiv.innerHTML = "<br>Esperando que el jugador seleccione dados<br>"
      return;
    }
    
    rolls.forEach(roll => {
      const diceClass = roll.energy ? "dice energy" : `dice ${roll.face.toLowerCase()}`
      rollsDiv.innerHTML += `<div class="${diceClass}" onclick="selectRoll(this)">${roll.face}</div>`
    })
  }

  function selectRoll(diceElement) {
    // Solo permitir selección si es el jugador activo
    if (activePlayer !== userId) return;
    
    const face = diceElement.textContent;
    const isEnergy = diceElement.classList.contains("energy");
    
    // Crear objeto de dado seleccionado
    const selectedRoll = {
      face: face,
      energy: isEnergy
    };
    
    // Añadir a la lista de dados seleccionados
    selectedRolls.push(selectedRoll);
    
    // Marcar el dado como seleccionado visualmente
    diceElement.classList.add("selected");
    
    // Actualizar la sección de dados seleccionados
    updateSelectedRolls();
    
    // Si se han seleccionado 6 dados, enviar al servidor
    if (selectedRolls.length === 6) {
      sendSelectedRolls();
    }
  }

  function updateSelectedRolls() {
    const selectedRollsDiv = document.querySelector("#selected-rolls");
    selectedRollsDiv.innerHTML = "<br>Dados seleccionados:<br>";
    
    selectedRolls.forEach(roll => {
      const diceClass = roll.energy ? "dice energy" : `dice ${roll.face.toLowerCase()}`
      selectedRollsDiv.innerHTML += `<div class="${diceClass}">${roll.face}</div>`
    });
  }

  function sendSelectedRolls() {
    ws.send(JSON.stringify({
      type: "select-rolls",
      body: {
        rolls: selectedRolls
      }
    }));
    
    // Limpiar selección
    selectedRolls = [];
    document.querySelectorAll("#rolls .dice").forEach(dice => {
      dice.classList.remove("selected");
    });
  }

  function showGodFavor() {
    const godFavorDiv = document.querySelector("#god-favor")
    godFavorDiv.innerHTML = `
      <div class="god-favor-option" onclick="selectGodFavor('attack')">Ataque</div>
      <div class="god-favor-option" onclick="selectGodFavor('defense')">Defensa</div>
      <div class="god-favor-option" onclick="selectGodFavor('steal')">Robo</div>
    `
  }

  function updatePlayerInfo(state) {
    // Actualizar información de los jugadores
    const playersDiv = document.querySelector("#players")
    playersDiv.innerHTML = ""
    
    Object.keys(state.users).forEach(userId => {
      const playerInfo = state.users[userId]
      const player = players.find(p => p.id === userId)
      const isCurrentPlayer = userId === state.activePlayer
      
      let playerText = `${player.username} - Vida: ${playerInfo.life} - Energía: ${playerInfo.energy}`
      if (isCurrentPlayer) {
        playerText += " (Tu turno)"
      }
      playersDiv.innerHTML += `<div>${playerText}</div>`
    })
  }

  function updateCombatLog(message) {
    const combatLog = document.querySelector("#combat-log")
    combatLog.innerHTML += `<div>${message}</div>`
    combatLog.scrollTop = combatLog.scrollHeight
  }

  function showGameOver(winner) {
    const gameOverDiv = document.createElement("div")
    gameOverDiv.id = "game-over"
    gameOverDiv.innerHTML = `¡Juego terminado! Ganador: ${winner}`
    document.querySelector("#game-container").appendChild(gameOverDiv)
  }

  function selectGodFavor(favor) {
    ws.send(JSON.stringify({
      type: "select-favor",
      body: {
        favor: favor
      }
    }))
  }

  searchButton.addEventListener("click", async () => {
    searchButton.setAttribute("disabled", true)
    ws = new WebSocket("wss://" + window.location.host)
    initializeWS()

    searchButton.value = "Conectando"

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject("Timeout connecting to ws"), 10000)

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
