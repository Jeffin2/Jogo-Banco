const socket = io();

function createRoom() {
    const name = document.getElementById("name").value;
    if (!name) return alert("Digite seu nome!");

    socket.emit("createRoom", { name });
}

function joinRoom() {
    const name = document.getElementById("name").value;
    const roomId = document.getElementById("roomId").value;

    if (!name || !roomId) return alert("Preencha tudo!");

    socket.emit("joinRoom", { name, roomId });
}

socket.on("roomCreated", (roomId) => {
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("room").classList.remove("hidden");
    document.getElementById("roomCode").innerText = roomId;
});

socket.on("updateRoom", (room) => {
    const playersList = document.getElementById("players");
    playersList.innerHTML = "";

    room.players.forEach(player => {
        const li = document.createElement("li");
        li.innerText = player.name;
        playersList.appendChild(li);
    });
});