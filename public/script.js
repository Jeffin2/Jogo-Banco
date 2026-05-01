const socket = io();

const playersEl = document.getElementById("players");
const boardEl = document.getElementById("board");
const turnEl = document.getElementById("turn");

let myName="", myId="";
let players=[], board=[];

const icons = ["🔴","🔵","🟢","🟡"];

socket.on("connect",()=>myId=socket.id);

function show(id){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

function goLobby(){
    myName=nameInput.value;
    show("screenLobby");
}

function createRoom(){ socket.emit("createRoom",{name:myName}); }
function joinRoom(){ socket.emit("joinRoom",{name:myName,roomId:roomIdInput.value}); }

socket.on("roomCreated",enterRoom);
socket.on("roomJoined",enterRoom);

function enterRoom(id){
    roomCode.innerText=id;
    show("screenRoom");
}

socket.on("updateRoom",(room)=>{
    players=room.players;
    board=room.board;

    playersEl.innerHTML="";
    players.forEach(p=>{
        const li=document.createElement("li");
        li.innerText=`${p.name} 💰 ${p.money}`;
        playersEl.appendChild(li);
    });

    renderBoard();
});

socket.on("gameStarted",({currentPlayer})=>{
    show("screenGame");
    turnEl.innerText="Vez de "+currentPlayer.name;
});

socket.on("nextTurn",(p)=>{
    turnEl.innerText="Vez de "+p.name;
});

function rollDice(){ socket.emit("rollDice"); }

socket.on("startMove", async ({playerId,steps})=>{
    for(let i=0;i<steps;i++){
        players.forEach(p=>{
            if(p.id===playerId){
                p.position=(p.position+1)%board.length;
            }
        });
        renderBoard();
        await new Promise(r=>setTimeout(r,200));
    }
    socket.emit("finishMove");
});

socket.on("offerBuy",(cell)=>{
    if(confirm(`Comprar ${cell.name}?`)){
        socket.emit("buyProperty");
    }
});

socket.on("offerBuild",()=>{
    if(confirm("Construir casa/hotel?")){
        socket.emit("buildHouse");
    }
});

function renderBoard(){
    boardEl.innerHTML="";

    board.forEach((cell,i)=>{
        const div=document.createElement("div");
        div.className="cell";
        div.innerText=cell.name;

        if(cell.level>0){
            const h=document.createElement("div");
            h.className="houses";
            h.innerText = cell.level<5 ? "🟩".repeat(cell.level) : "🟥";
            div.appendChild(h);
        }

        players.forEach((p,index)=>{
            if(p.position===i){
                const pl=document.createElement("div");
                pl.className="player";
                pl.innerText=icons[index];
                div.appendChild(pl);
            }
        });

        boardEl.appendChild(div);
    });
}