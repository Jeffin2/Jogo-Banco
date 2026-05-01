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
            players: [{ id: socket.id, name }]
        };

        socket.join(roomId);
        socket.roomId = roomId;

        console.log(`🏠 Sala ${roomId} criada por ${name}`);

        socket.emit("roomCreated", roomId);
        io.to(roomId).emit("updateRoom", rooms[roomId]);
    });

    // Entrar na sala
    socket.on("joinRoom", ({ name, roomId }) => {
        const room = rooms[roomId];
        if (!room) return;

        if (room.players.length >= 4) return;

        room.players.push({ id: socket.id, name });

        socket.join(roomId);
        socket.roomId = roomId;

        console.log(`👤 ${name} entrou na sala ${roomId}`);

        socket.emit("roomJoined", roomId);
        io.to(roomId).emit("updateRoom", room);
    });

    // Iniciar jogo (SÓ ADMIN)
    socket.on("startGame", () => {
        const room = rooms[socket.roomId];
        if (!room) return;

        if (socket.id !== room.admin) {
            console.log("❌ Não é admin, não pode iniciar");
            return;
        }

        console.log("🎮 Jogo iniciado");

        io.to(socket.roomId).emit("gameStarted");
    });

    // Expulsar jogador
    socket.on("kickPlayer", (playerId) => {
        const room = rooms[socket.roomId];
        if (!room) return;

        if (socket.id !== room.admin) return;

        room.players = room.players.filter(p => p.id !== playerId);

        io.to(playerId).emit("kicked");
        io.sockets.sockets.get(playerId)?.leave(socket.roomId);

        console.log(`🚫 Jogador expulso: ${playerId}`);

        io.to(socket.roomId).emit("updateRoom", room);
    });

    // Desconectar
    socket.on("disconnect", () => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;

        const room = rooms[roomId];

        room.players = room.players.filter(p => p.id !== socket.id);

        // Se admin sair → passa admin pro próximo
        if (room.admin === socket.id && room.players.length > 0) {
            room.admin = room.players[0].id;
            console.log("👑 Novo admin definido");
        }

        io.to(roomId).emit("updateRoom", room);

        if (room.players.length === 0) delete rooms[roomId];
    });
});

http.listen(3000, "0.0.0.0", () => {
    console.log("🚀 Servidor rodando");
});