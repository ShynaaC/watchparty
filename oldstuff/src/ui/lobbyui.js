export function createLobbyUI(){

    const container = document.createElement("div")

    container.id = "lobby-ui"

    container.innerHTML = `
        <h1>WATCH PARTY</h1>

        <button id="enter-btn">
            Enter Theatre
        </button>
    `

    document.body.appendChild(container)

    document
        .getElementById("enter-btn")
        .addEventListener("click",()=>{

            removeLobbyUI()

            window.loadScene("theater")

        })

}

export function removeLobbyUI(){

    const ui =
        document.getElementById(
            "lobby-ui"
        )

    if(ui){
        ui.remove()
    }

}