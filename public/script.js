const socket = io();

let myId = "";
let myName = "";
let players = [];

const BOARD = [
    { type: "start", name: "Início" },
    { type: "property", name: "Rua A" },
    { type: "property", name: "Rua B" },
    { type: "tax", name: "Imposto" },
    { type: "property", name: "Rua C" },
    { type: "chance", name: "Sorte" },
    { type: "property", name: "Rua D" },
    { type: "jail", name: "Prisão" },
    { type: "property", name: "Rua E" },
    { type: "tax", name: "Taxa" }
];

// conexão
socket.on("connect", () => {
    myId = socket.id;
});

// telas
function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// fluxo
function goToLobby() {
    const name = document.getElementById("nameInput").value;
    if (!name) return alert("Digite seu nome!");

    myName = name;
    document.getElementById("playerName").innerText = name;

    showScreen("screenLobby");
}

// sala
function createRoom() {
    socket.emit("createRoom", { name: myName });
}

function joinRoom() {
    const roomId = document.getElementById("roomIdInput").value;
    socket.emit("joinRoom", { name: myName, roomId });
}

socket.on("roomCreated", enterGame);
socket.on("roomJoined", enterGame);

function enterGame(roomId) {
    document.getElementById("roomCode").innerText = roomId;
    showScreen("screenGame");
}

// jogadores
socket.on("updateRoom", (room) => {
    players = room.players;
    renderPlayers();
    renderBoard();
});

function renderPlayers() {
    const ul = document.getElementById("players");
    ul.innerHTML = "";

    players.forEach(p => {
        const li = document.createElement("li");
        li.innerText = `${p.name} ($${p.money})`;
        ul.appendChild(li);
    });
}

// jogo
function startGame() {
    socket.emit("startGame");
}

socket.on("gameStarted", ({ currentPlayer }) => {
    document.getElementById("turn").innerText = "Vez de " + currentPlayer.name;
});

socket.on("nextTurn", (p) => {
    document.getElementById("turn").innerText = "Vez de " + p.name;
});

function rollDice() {
    socket.emit("rollDice");
}

socket.on("playerMoved", ({ player, dice, cell }) => {
    document.getElementById("dice").innerText =
        `${player.name} caiu em ${cell.name} (${dice})`;

    renderBoard();
});

// TABULEIRO (CORRIGIDO)
function renderBoard() {
    const board = document.getElementById("board");
    board.innerHTML = "";

    BOARD.forEach((cellData, i) => {
        const cell = document.createElement("div");
        cell.className = "cell " + cellData.type;
        cell.innerText = cellData.name;

        players.forEach(p => {
            if (p.position === i) {
                const pl = document.createElement("div");
                pl.className = "player";
                pl.innerText = "🧍";
                cell.appendChild(pl);
            }
        });

        board.appendChild(cell);
    });
}