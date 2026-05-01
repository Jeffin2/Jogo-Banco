const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

const BOARD = [
    { name: "Início" },
    { name: "Rua A", price: 100, baseRent: 20, owner: null, level: 0 },
    { name: "Rua B", price: 120, baseRent: 25, owner: null, level: 0 },
    { name: "Imposto", value: 50 },
    { name: "Rua C", price: 150, baseRent: 30, owner: null, level: 0 },
    { name: "Sorte" },
    { name: "Rua D", price: 200, baseRent: 40, owner: null, level: 0 },
    { name: "Prisão" },
    { name: "Rua E", price: 220, baseRent: 45, owner: null, level: 0 },
    { name: "Taxa", value: 100 }
];

let rooms = {};

function sendRoom(roomId) {
    io.to(roomId).emit("updateRoom", {
        ...rooms[roomId],
        board: BOARD
    });
}

io.on("connection", (socket) => {

    socket.on("createRoom", ({ name }) => {
        const id = Math.random().toString(36).substr(2, 5);

        rooms[id] = {
            admin: socket.id,
            players: [{
                id: socket.id,
                name,
                position: 0,
                money: 1000
            }],
            turnIndex: 0
        };

        socket.join(id);
        socket.roomId = id;

        socket.emit("roomCreated", id);
        sendRoom(id);
    });

    socket.on("joinRoom", ({ name, roomId }) => {
        const room = rooms[roomId];
        if (!room || room.players.length >= 4) {
            socket.emit("errorMsg", "Sala inválida ou cheia");
            return;
        }

        room.players.push({
            id: socket.id,
            name,
            position: 0,
            money: 1000
        });

        socket.join(roomId);
        socket.roomId = roomId;

        socket.emit("roomJoined", roomId);
        sendRoom(roomId);
    });

    socket.on("startGame", () => {
        const room = rooms[socket.roomId];

        if (!room) return;

        if (socket.id !== room.admin) {
            socket.emit("errorMsg", "Só o admin pode iniciar!");
            return;
        }

        if (room.players.length < 2) {
            socket.emit("errorMsg", "Precisa de pelo menos 2 jogadores!");
            return;
        }

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

        const player = room.players[room.turnIndex];
        const cell = BOARD[player.position];

        if (cell.price) {
            if (!cell.owner) {
                socket.emit("offerBuy", cell);
            } else if (cell.owner !== player.id) {
                const rent = cell.baseRent * (cell.level + 1);
                player.money -= rent;

                const owner = room.players.find(p => p.id === cell.owner);
                if (owner) owner.money += rent;
            }
        }

        if (cell.value) player.money -= cell.value;

        socket.emit("offerBuild");

        room.turnIndex = (room.turnIndex + 1) % room.players.length;

        io.to(socket.roomId).emit("nextTurn", room.players[room.turnIndex]);
        sendRoom(socket.roomId);
    });

    socket.on("buyProperty", () => {
        const room = rooms[socket.roomId];
        const player = room.players.find(p => p.id === socket.id);
        const cell = BOARD[player.position];

        if (!cell.price || cell.owner) return;

        if (player.money >= cell.price) {
            player.money -= cell.price;
            cell.owner = player.id;
        }

        sendRoom(socket.roomId);
    });

    socket.on("buildHouse", () => {
        const room = rooms[socket.roomId];
        const player = room.players.find(p => p.id === socket.id);
        const cell = BOARD[player.position];

        if (!cell.price || cell.owner !== player.id) return;
        if (cell.level >= 5) return;

        const cost = 50 + (cell.level * 50);

        if (player.money >= cost) {
            player.money -= cost;
            cell.level++;
        }

        sendRoom(socket.roomId);
    });
});

http.listen(3000, () => console.log("🚀 Servidor rodando"));