const socket = io();

let myId = "";
let players = [];
let board = [];

socket.on("connect", () => {
    myId = socket.id;
});

function createRoom() {
    socket.emit("createRoom", { name: name.value });
}

function joinRoom() {
    socket.emit("joinRoom", { name: name.value, roomId: roomId.value });
}

socket.on("roomCreated", showRoom);
socket.on("roomJoined", showRoom);

function showRoom(id) {
    menu.classList.add("hidden");
    room.classList.remove("hidden");
    roomCode.innerText = id;
}

socket.on("updateRoom", (roomData) => {
    players = roomData.players;
    renderPlayers();
    renderBoard();
});

function renderPlayers() {
    playersEl.innerHTML = "";
    players.forEach(p => {
        const li = document.createElement("li");
        li.innerText = `${p.name} ($${p.money})`;
        playersEl.appendChild(li);
    });
}

socket.on("gameStarted", ({ currentPlayer }) => {
    rollBtn.style.display = "block";
    turn.innerText = "Vez de " + currentPlayer.name;
});

socket.on("nextTurn", (p) => {
    turn.innerText = "Vez de " + p.name;
});

function rollDice() {
    socket.emit("rollDice");
}

socket.on("playerMoved", ({ player, dice, cell }) => {
    renderBoard();
    diceEl.innerText = `${player.name} caiu em ${cell.name} (${dice})`;
});

socket.on("offerBuy", (property) => {
    if (confirm(`Comprar ${property.name} por ${property.price}?`)) {
        socket.emit("buyProperty");
    }
});

socket.on("propertyBought", (d) => alert(`${d.player} comprou ${d.property}`));
socket.on("rentPaid", (d) => alert(`${d.from} pagou ${d.value} para ${d.to}`));

function renderBoard() {
    boardEl.innerHTML = "";

    for (let i = 0; i < 10; i++) {
        const cell = document.createElement("div");
        const data = ["start","property","property","tax","property","chance","property","jail","property","tax"][i];

        cell.className = "cell " + data;
        cell.innerText = i;

        players.forEach(p => {
            if (p.position === i) {
                const pl = document.createElement("div");
                pl.className = "player";
                pl.innerText = "🧍";
                cell.appendChild(pl);
            }
        });

        boardEl.appendChild(cell);
    }
}