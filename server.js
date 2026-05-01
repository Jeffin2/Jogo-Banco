const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

const BOARD = [
    { type: "start", name: "Início" },
    { type: "property", name: "Rua A", price: 100 },
    { type: "property", name: "Rua B", price: 120 },
    { type: "tax", name: "Imposto", value: 50 },
    { type: "property", name: "Rua C", price: 150 },
    { type: "chance", name: "Sorte" },
    { type: "property", name: "Rua D", price: 200 },
    { type: "jail", name: "Prisão" },
    { type: "property", name: "Rua E", price: 220 },
    { type: "tax", name: "Taxa", value: 100 }
];

let rooms = {};

function sendRoom(roomId) {
    const room = rooms[roomId];
    io.to(roomId).emit("updateRoom", {
        ...room,
        board: BOARD
    });
}

io.on("connection", (socket) => {
    socket.on("createRoom", ({ name }) => {
        const id = Math.random().toString(36).substr(2, 5);

        rooms[id] = {
            admin: socket.id,
            players: [{ id: socket.id, name, position: 0 }],
            turnIndex: 0
        };

        socket.join(id);
        socket.roomId = id;

        socket.emit("roomCreated", id);
        sendRoom(id);
    });

    socket.on("joinRoom", ({ name, roomId }) => {
        const room = rooms[roomId];
        if (!room || room.players.length >= 4) return;

        room.players.push({ id: socket.id, name, position: 0 });

        socket.join(roomId);
        socket.roomId = roomId;

        socket.emit("roomJoined", roomId);
        sendRoom(roomId);
    });

    socket.on("startGame", () => {
        const room = rooms[socket.roomId];
        if (!room || socket.id !== room.admin) return;

        io.to(socket.roomId).emit("gameStarted", {
            currentPlayer: room.players[0]
        });
    });

    socket.on("rollDice", () => {
        const room = rooms[socket.roomId];
        if (!room) return;

        const player = room.players[room.turnIndex];
        if (socket.id !== player.id) return;

        const dice = Math.floor(Math.random() * 6) + 1;

        io.to(socket.roomId).emit("startMove", {
            playerId: player.id,
            steps: dice
        });
    });

    socket.on("finishMove", () => {
        const room = rooms[socket.roomId];
        if (!room) return;

        room.turnIndex = (room.turnIndex + 1) % room.players.length;

        io.to(socket.roomId).emit("nextTurn", room.players[room.turnIndex]);
        sendRoom(socket.roomId);
    });

    socket.on("kickPlayer", (id) => {
        const room = rooms[socket.roomId];
        if (!room || socket.id !== room.admin) return;

        room.players = room.players.filter(p => p.id !== id);
        sendRoom(socket.roomId);
    });
});

http.listen(3000, () => console.log("🚀 Rodando"));