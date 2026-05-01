const socket = io();

let myName = "";
let myId = "";
let isAdmin = false;
let players = [];
let board = [];

socket.on("connect", () => myId = socket.id);

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

function goToLobby() {
    myName = nameInput.value;
    if (!myName) return alert("Digite seu nome");
    showScreen("screenLobby");
}

function createRoom() {
    socket.emit("createRoom", { name: myName });
}

function joinRoom() {
    socket.emit("joinRoom", {
        name: myName,
        roomId: roomIdInput.value
    });
}

socket.on("roomCreated", enterRoom);
socket.on("roomJoined", enterRoom);

function enterRoom(id) {
    roomCode.innerText = id;
    showScreen("screenRoom");
}

socket.on("updateRoom", (room) => {
    players = room.players;
    board = room.board;
    isAdmin = room.admin === myId;

    renderPlayers();
    renderBoard();

    startBtn.style.display = isAdmin ? "block" : "none";
});

function renderPlayers() {
    playersEl.innerHTML = "";
    players.forEach(p => {
        const li = document.createElement("li");
        li.innerText = `${p.name} ($${p.money})`;

        if (isAdmin && p.id !== myId) {
            const btn = document.createElement("button");
            btn.innerText = "Expulsar";
            btn.onclick = () => socket.emit("kickPlayer", p.id);
            li.appendChild(btn);
        }

        playersEl.appendChild(li);
    });
}

function startGame() {
    socket.emit("startGame");
}

socket.on("gameStarted", ({ currentPlayer }) => {
    showScreen("screenGame");
    document.getElementById("screenGame").classList.add("fadeIn");
    turn.innerText = "Vez de " + currentPlayer.name;
});

socket.on("nextTurn", (p) => {
    turn.innerText = "Vez de " + p.name;
});

function rollDice() {
    socket.emit("rollDice");
}

socket.on("playerMoved", ({ player, dice, cell }) => {
    diceEl.innerText = `${player.name} caiu em ${cell.name} (${dice})`;
    renderBoard();
});

socket.on("offerBuy", (prop) => {
    if (confirm(`Comprar ${prop.name} por ${prop.price}?`)) {
        socket.emit("buyProperty");
    }
});

function renderBoard() {
    if (!board.length) return;

    boardEl.innerHTML = "";

    board.forEach((cell, i) => {
        const div = document.createElement("div");
        div.className = "cell " + cell.type;
        div.innerText = cell.name;

        players.forEach(p => {
            if (p.position === i) {
                const pl = document.createElement("div");
                pl.className = "player";
                pl.innerText = "🧍";
                div.appendChild(pl);
            }
        });

        boardEl.appendChild(div);
    });
}