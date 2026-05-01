const socket = io();

let currentRoom = "";

function createRoom() {
    const name = document.getElementById("name").value;
    if (!name) return alert("Digite seu nome!");

    socket.emit("createRoom", { name });
}

function joinRoom() {
    const name = document.getElementById("name").value;
    const roomId = document.getElementById("roomId").value;

    if (!name || !roomId) return alert("Preencha tudo!");

    socket.emit("joinRoom", { name, roomId });
}

socket.on("roomCreated", (roomId) => {
    currentRoom = roomId;

    document.getElementById("menu").classList.add("hidden");
    document.getElementById("room").classList.remove("hidden");

    document.getElementById("roomCode").innerText = roomId;

    alert("Sala criada! Código: " + roomId);
});

socket.on("updateRoom", (room) => {
    const playersList = document.getElementById("players");
    playersList.innerHTML = "";

    room.players.forEach(player => {
        const li = document.createElement("li");
        li.innerText = player.name;

        li.style.opacity = 0;
        setTimeout(() => li.style.opacity = 1, 100);

        playersList.appendChild(li);
    });

    if (room.players.length >= 2) {
        document.getElementById("startBtn").classList.remove("hidden");
    }
});

function startGame() {
    alert("🚧 Próxima etapa: implementar tabuleiro + turnos!");
}