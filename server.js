const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {
    console.log("Novo jogador conectado");

    socket.on("createRoom", ({ name }) => {
        const roomId = Math.random().toString(36).substr(2, 5);

        rooms[roomId] = {
            players: [{ id: socket.id, name }]
        };

        socket.join(roomId);
        socket.roomId = roomId;

        io.to(roomId).emit("updateRoom", rooms[roomId]);
        socket.emit("roomCreated", roomId);
    });

    socket.on("joinRoom", ({ name, roomId }) => {
        const room = rooms[roomId];

        if (!room) return;

        if (room.players.length >= 4) return;

        room.players.push({ id: socket.id, name });

        socket.join(roomId);
        socket.roomId = roomId;

        io.to(roomId).emit("updateRoom", room);
    });

    socket.on("disconnect", () => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;

        rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);

        io.to(roomId).emit("updateRoom", rooms[roomId]);

        if (rooms[roomId].players.length === 0) {
            delete rooms[roomId];
        }
    });
});

http.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});