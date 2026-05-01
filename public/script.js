const socket = io();

let myId = "";
let isAdmin = false;
let myTurn = false;

let playersPositions = {};
const boardSize = 20;

socket.on("connect", () => {
    myId = socket.id;
});

// UI
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

// Atualizar sala
socket.on("updateRoom", (room) => {
    const list = document.getElementById("players");
    list.innerHTML = "";

    isAdmin = room.admin === myId;

    room.players.forEach(p => {
        playersPositions[p.id] = p.position || 0;

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

    renderBoard();

    const startBtn = document.getElementById("startBtn");
    startBtn.style.display = (isAdmin && room.players.length >= 2) ? "block" : "none";
});

// Iniciar
function startGame() {
    socket.emit("startGame");
}

socket.on("gameStarted", ({ currentPlayer }) => {
    document.getElementById("rollBtn").style.display = "block";
    updateTurn(currentPlayer);
});

// Turno
socket.on("nextTurn", updateTurn);

function updateTurn(player) {
    const turn = document.getElementById("turn");
    myTurn = player.id === myId;

    turn.innerText = "Vez de: " + player.name + (myTurn ? " (VOCÊ)" : "");
}

// Dado
function rollDice() {
    if (!myTurn) return alert("Não é sua vez!");
    socket.emit("rollDice");
}

// Movimento
socket.on("playerMoved", ({ playerId, position, dice }) => {
    playersPositions[playerId] = position;

    document.getElementById("dice").innerText =
        `🎲 Movimento: ${dice}`;

    renderBoard();
});

// Tabuleiro
function renderBoard() {
    const board = document.getElementById("board");
    board.innerHTML = "";

    for (let i = 0; i < boardSize; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.innerText = i;

        for (let id in playersPositions) {
            if (playersPositions[id] === i) {
                const p = document.createElement("div");
                p.className = "player";
                p.innerText = "🧍";
                cell.appendChild(p);
            }
        }

        board.appendChild(cell);
    }
}

socket.on("kicked", () => {
    alert("Você foi expulso!");
    location.reload();
});