const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {
    console.log("🟢 Conectado:", socket.id);

    // Criar sala
    socket.on("createRoom", ({ name }) => {
        const roomId = Math.random().toString(36).substr(2, 5);

        rooms[roomId] = {
            admin: socket.id,
            players: [{ id: socket.id, name }],
            turnIndex: 0,
            gameStarted: false
        };

        socket.join(roomId);
        socket.roomId = roomId;

        console.log(`🏠 Sala criada: ${roomId}`);

        socket.emit("roomCreated", roomId);
        io.to(roomId).emit("updateRoom", rooms[roomId]);
    });

    // Entrar
    socket.on("joinRoom", ({ name, roomId }) => {
        const room = rooms[roomId];
        if (!room) return;

        if (room.players.length >= 4) return;

        room.players.push({ id: socket.id, name });

        socket.join(roomId);
        socket.roomId = roomId;

        console.log(`👤 Entrou: ${name}`);

        socket.emit("roomJoined", roomId);
        io.to(roomId).emit("updateRoom", room);
    });

    // Iniciar jogo
    socket.on("startGame", () => {
        const room = rooms[socket.roomId];
        if (!room) return;

        if (socket.id !== room.admin) return;

        if (room.players.length < 2) return;

        room.gameStarted = true;
        room.turnIndex = 0;

        console.log("🎮 Jogo iniciado");

        io.to(socket.roomId).emit("gameStarted", {
            currentPlayer: room.players[0]
        });
    });

    // Rolar dado
    socket.on("rollDice", () => {
        const room = rooms[socket.roomId];
        if (!room || !room.gameStarted) return;

        const currentPlayer = room.players[room.turnIndex];

        if (socket.id !== currentPlayer.id) return;

        const dice = Math.floor(Math.random() * 6) + 1;

        console.log(`🎲 ${currentPlayer.name} tirou ${dice}`);

        io.to(socket.roomId).emit("diceRolled", {
            player: currentPlayer,
            value: dice
        });

        room.turnIndex = (room.turnIndex + 1) % room.players.length;

        const nextPlayer = room.players[room.turnIndex];

        io.to(socket.roomId).emit("nextTurn", nextPlayer);
    });

    // Expulsar
    socket.on("kickPlayer", (playerId) => {
        const room = rooms[socket.roomId];
        if (!room) return;

        if (socket.id !== room.admin) return;

        room.players = room.players.filter(p => p.id !== playerId);

        io.to(playerId).emit("kicked");
        io.sockets.sockets.get(playerId)?.leave(socket.roomId);

        io.to(socket.roomId).emit("updateRoom", room);
    });

    // Sair
    socket.on("disconnect", () => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;

        const room = rooms[roomId];

        room.players = room.players.filter(p => p.id !== socket.id);

        if (room.admin === socket.id && room.players.length > 0) {
            room.admin = room.players[0].id;
        }

        io.to(roomId).emit("updateRoom", room);

        if (room.players.length === 0) delete rooms[roomId];
    });
});

http.listen(3000, "0.0.0.0", () => {
    console.log("🚀 Servidor rodando em http://localhost:3000");
});