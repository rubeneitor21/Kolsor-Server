;(async () => {
  document.cookie = "jwt=; path=/;" 
  const loginButton = document.querySelector("#login")

  loginButton.addEventListener("click", async () => {
    const user = document.querySelector("#user").value
    const password = document.querySelector("#password").value

    if (!user || !password) {
      alert("Rellena los campos")
      return
    }

    const response = await fetch(window.location.protocol + "//" + window.location.host + "/api/login", {
      method: "POST",
      body: JSON.stringify({
        "username": user,
        "password": password
      })
    })

    const data = await response.json()

    console.log(data)

    // localStorage.setItem("jwt", data.token)
    // document.cookie = `jwt=${data.token}; path=/;`
  })
})()
