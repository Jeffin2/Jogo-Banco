const socket = io();

let myId = "";
let isAdmin = false;
let myTurn = false;

socket.on("connect", () => {
    myId = socket.id;
    console.log("🟢 Conectado:", myId);
});

function createRoom() {
    const name = document.getElementById("name").value;
    socket.emit("createRoom", { name });
}

function joinRoom() {
    const name = document.getElementById("name").value;
    const roomId = document.getElementById("roomId").value;
    socket.emit("joinRoom", { name, roomId });
}

socket.on("roomCreated", showRoom);
socket.on("roomJoined", showRoom);

function showRoom(roomId) {
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("room").classList.remove("hidden");
    document.getElementById("roomCode").innerText = roomId;
}

socket.on("updateRoom", (room) => {
    const list = document.getElementById("players");
    list.innerHTML = "";

    isAdmin = room.admin === myId;

    room.players.forEach(p => {
        const li = document.createElement("li");
        li.innerText = p.name;

        if (isAdmin && p.id !== myId) {
            const btn = document.createElement("button");
            btn.innerText = "Expulsar";
            btn.onclick = () => socket.emit("kickPlayer", p.id);
            li.appendChild(btn);
        }

        list.appendChild(li);
    });

    const startBtn = document.getElementById("startBtn");
    startBtn.style.display = (isAdmin && room.players.length >= 2) ? "block" : "none";
});

function startGame() {
    socket.emit("startGame");
}

socket.on("gameStarted", ({ currentPlayer }) => {
    document.getElementById("rollBtn").style.display = "block";
    updateTurn(currentPlayer);
});

socket.on("nextTurn", updateTurn);

function updateTurn(player) {
    const turn = document.getElementById("turn");
    myTurn = player.id === myId;

    turn.innerText = "Vez de: " + player.name + (myTurn ? " (VOCÊ)" : "");
}

function rollDice() {
    if (!myTurn) return alert("Não é sua vez!");
    socket.emit("rollDice");
}

socket.on("diceRolled", ({ player, value }) => {
    document.getElementById("dice").innerText =
        `${player.name} tirou 🎲 ${value}`;
});

socket.on("kicked", () => {
    alert("Você foi expulso!");
    location.reload();
});