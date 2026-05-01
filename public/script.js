const socket = io();

let currentRoom = "";
let myId = "";
let isAdmin = false;

socket.on("connect", () => {
    myId = socket.id;
});

// Criar sala
function createRoom() {
    const name = document.getElementById("name").value;
    if (!name) return alert("Digite seu nome!");

    socket.emit("createRoom", { name });
}

// Entrar na sala
function joinRoom() {
    const name = document.getElementById("name").value;
    const roomId = document.getElementById("roomId").value;

    if (!name || !roomId) return alert("Preencha tudo!");

    socket.emit("joinRoom", { name, roomId });
}

// Criou sala
socket.on("roomCreated", (roomId) => {
    currentRoom = roomId;
    showRoom(roomId);
});

// Entrou
socket.on("roomJoined", (roomId) => {
    currentRoom = roomId;
    showRoom(roomId);
});

function showRoom(roomId) {
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("room").classList.remove("hidden");
    document.getElementById("roomCode").innerText = roomId;
}

// Atualizar sala
socket.on("updateRoom", (room) => {
    const playersList = document.getElementById("players");
    playersList.innerHTML = "";

    isAdmin = room.admin === myId;

    room.players.forEach(player => {
        const li = document.createElement("li");
        li.innerText = player.name;

        // botão expulsar (só admin)
        if (isAdmin && player.id !== myId) {
            const btn = document.createElement("button");
            btn.innerText = "Expulsar";
            btn.onclick = () => socket.emit("kickPlayer", player.id);
            li.appendChild(btn);
        }

        playersList.appendChild(li);
    });

    // botão iniciar
    const startBtn = document.getElementById("startBtn");
    if (isAdmin && room.players.length >= 2) {
        startBtn.classList.remove("hidden");
    } else {
        startBtn.classList.add("hidden");
    }
});

// iniciar jogo
function startGame() {
    socket.emit("startGame");
}

// jogo iniciou
socket.on("gameStarted", () => {
    alert("🎮 O jogo começou!");
});

// foi expulso
socket.on("kicked", () => {
    alert("🚫 Você foi expulso da sala!");
    location.reload();
});