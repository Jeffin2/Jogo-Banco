const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

// 🗺️ TABULEIRO
const BOARD = [
    { type: "start", name: "Início" },

    { type: "property", name: "Rua A", price: 100, rent: 20, owner: null },
    { type: "property", name: "Rua B", price: 120, rent: 25, owner: null },

    { type: "tax", name: "Imposto", value: 50 },

    { type: "property", name: "Rua C", price: 150, rent: 30, owner: null },

    { type: "chance", name: "Sorte" },

    { type: "property", name: "Rua D", price: 200, rent: 40, owner: null },

    { type: "jail", name: "Prisão" },

    { type: "property", name: "Rua E", price: 220, rent: 45, owner: null },

    { type: "tax", name: "Taxa", value: 100 }
];

let rooms = {};

io.on("connection", (socket) => {
    console.log("🟢 Conectado:", socket.id);

    socket.on("createRoom", ({ name }) => {
        const roomId = Math.random().toString(36).substr(2, 5);

        rooms[roomId] = {
            admin: socket.id,
            players: [{
                id: socket.id,
                name,
                position: 0,
                money: 1000
            }],
            turnIndex: 0,
            gameStarted: false
        };

        socket.join(roomId);
        socket.roomId = roomId;

        socket.emit("roomCreated", roomId);
        io.to(roomId).emit("updateRoom", rooms[roomId]);
    });

    socket.on("joinRoom", ({ name, roomId }) => {
        const room = rooms[roomId];
        if (!room || room.players.length >= 4) return;

        room.players.push({
            id: socket.id,
            name,
            position: 0,
            money: 1000
        });

        socket.join(roomId);
        socket.roomId = roomId;

        socket.emit("roomJoined", roomId);
        io.to(roomId).emit("updateRoom", room);
    });

    socket.on("startGame", () => {
        const room = rooms[socket.roomId];
        if (!room || socket.id !== room.admin || room.players.length < 2) return;

        room.gameStarted = true;
        room.turnIndex = 0;

        io.to(socket.roomId).emit("gameStarted", {
            currentPlayer: room.players[0]
        });
    });

    socket.on("rollDice", () => {
        const room = rooms[socket.roomId];
        if (!room || !room.gameStarted) return;

        const player = room.players[room.turnIndex];
        if (socket.id !== player.id) return;

        const dice = Math.floor(Math.random() * 6) + 1;

        player.position = (player.position + dice) % BOARD.length;

        const cell = BOARD[player.position];

        // 🏠 PROPRIEDADE
        if (cell.type === "property") {
            if (!cell.owner) {
                socket.emit("offerBuy", cell);
            } else if (cell.owner !== player.id) {
                player.money -= cell.rent;
                const owner = room.players.find(p => p.id === cell.owner);
                if (owner) owner.money += cell.rent;

                io.to(socket.roomId).emit("rentPaid", {
                    from: player.name,
                    to: owner.name,
                    value: cell.rent
                });
            }
        }

        // 💸 TAXA
        if (cell.type === "tax") {
            player.money -= cell.value;
        }

        // 🎁 SORTE
        if (cell.type === "chance") {
            player.money += 50;
        }

        io.to(socket.roomId).emit("playerMoved", {
            player,
            dice,
            cell
        });

        room.turnIndex = (room.turnIndex + 1) % room.players.length;

        io.to(socket.roomId).emit("nextTurn", room.players[room.turnIndex]);
    });

    socket.on("buyProperty", () => {
        const room = rooms[socket.roomId];
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        const cell = BOARD[player.position];

        if (cell.type !== "property" || cell.owner) return;

        if (player.money >= cell.price) {
            player.money -= cell.price;
            cell.owner = player.id;

            io.to(socket.roomId).emit("propertyBought", {
                player: player.name,
                property: cell.name
            });
        }
    });

    socket.on("disconnect", () => {
        const room = rooms[socket.roomId];
        if (!room) return;

        room.players = room.players.filter(p => p.id !== socket.id);

        if (room.admin === socket.id && room.players.length > 0) {
            room.admin = room.players[0].id;
        }

        io.to(socket.roomId).emit("updateRoom", room);

        if (room.players.length === 0) delete rooms[socket.roomId];
    });
});

http.listen(3000, "0.0.0.0", () => {
    console.log("🚀 Servidor rodando");
});