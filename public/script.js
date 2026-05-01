const socket = io();

const playersEl = document.getElementById("players");
const boardEl = document.getElementById("board");
const startBtn = document.getElementById("startBtn");
const turnEl = document.getElementById("turn");
const statusEl = document.getElementById("status");

let myName = "";
let myId = "";
let players = [];
let board = [];

const icons = ["🔴","🔵","🟢","🟡"];

socket.on("connect", () => myId = socket.id);

function show(id){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

function goLobby(){
    myName = nameInput.value;
    if(!myName) return alert("Digite seu nome");
    show("screenLobby");
}

function createRoom(){
    socket.emit("createRoom",{name:myName});
}

function joinRoom(){
    socket.emit("joinRoom",{name:myName,roomId:roomIdInput.value});
}

socket.on("roomCreated", enterRoom);
socket.on("roomJoined", enterRoom);

function enterRoom(id){
    roomCode.innerText=id;
    show("screenRoom");
}

socket.on("updateRoom",(room)=>{
    players = room.players;
    board = room.board;

    const isAdmin = room.admin === myId;

    playersEl.innerHTML = "";

    players.forEach(p=>{
        const li = document.createElement("li");
        li.innerText = p.name;

        if(isAdmin && p.id !== myId){
            const btn = document.createElement("button");
            btn.innerText = "Expulsar";
            btn.onclick = ()=>socket.emit("kickPlayer",p.id);
            li.appendChild(btn);
        }

        playersEl.appendChild(li);
    });

    statusEl.innerText = `Jogadores: ${players.length}/4`;

    startBtn.style.display = isAdmin ? "block" : "none";

    renderBoard();
});

socket.on("errorMsg", msg => alert(msg));

function startGame(){
    socket.emit("startGame");
}

socket.on("gameStarted",({currentPlayer})=>{
    show("screenGame");
    turnEl.innerText = "Vez de " + currentPlayer.name;
});

socket.on("nextTurn",(p)=>{
    turnEl.innerText = "Vez de " + p.name;
});

function rollDice(){
    socket.emit("rollDice");
}

socket.on("startMove", async ({playerId,steps})=>{
    for(let i=0;i<steps;i++){
        players.forEach(p=>{
            if(p.id===playerId){
                p.position = (p.position+1)%board.length;
            }
        });

        renderBoard();
        await new Promise(r=>setTimeout(r,300));
    }

    socket.emit("finishMove");
});

function renderBoard(){
    boardEl.innerHTML = "";

    board.forEach((cell,i)=>{
        const div = document.createElement("div");
        div.className = "cell";
        div.innerText = cell.name;

        players.forEach((p,index)=>{
            if(p.position === i){
                const pl = document.createElement("div");
                pl.className = "player";
                pl.innerText = icons[index];
                div.appendChild(pl);
            }
        });

        boardEl.appendChild(div);
    });
}

socket.on("kicked", ()=>{
    alert("Você foi expulso!");
    location.reload();