const showGameId = (id) => {
    var displayGameId = document.createTextNode("Your game id is: " + id);
    document.getElementById("displayId").appendChild(displayGameId);
};

const onFormSubmitted = (e) => {
    e.preventDefault();
    const input = document.querySelector('#chat');
    const text = input.value;
    input.value = '';

    socket.emit('message', text);
};

const socket = io();

let clientId = null;
// HTML elements
socket.on('connect', () => {
    clientId = socket.id;
})

let gameId = null;

const createOption = document.getElementById("createOption");
const joinOption = document.getElementById("joinOption")
const createButton = document.getElementById("create");
const joinButton = document.getElementById("join");
const gameIdText = document.getElementById("gameId");
const playerName = document.getElementById("playerName");

// Event handling
createOption.addEventListener("click", e => {
    for (let el of document.querySelectorAll(".joinForm")) {
        el.style.display = "none";
    }

    for (let el of document.querySelectorAll(".createForm")) {
        el.style.display = "block";
    }
});

joinOption.addEventListener("click", e => {
    for (let el of document.querySelectorAll(".createForm")) {
        el.style.display = "none";
    }

    for (let el of document.querySelectorAll(".joinForm")) {
        el.style.display = "block";
    }
});

createButton.addEventListener("click", e => {
    const payLoad = {
        "clientId": clientId,
        "name": playerName.value
    }; 
    playerName.value = '';
    socket.emit('create', payLoad);

    document.querySelector(".intro-wrapper").style.display = "none";
    document.querySelector(".lobby").style.display = "block";
});

joinButton.addEventListener("click", e => {
    gameId = gameIdText.value;
    const payLoad = {
        "clientId": clientId,
        "gameId": gameId,
        "name": playerName.value
    };

    playerName.value = '';
    gameIdText.value = '';
    socket.emit('join', payLoad);
});

// Server events
socket.on('gameCreated', (id) => {
    gameId = id;
    showGameId(gameId);
});

socket.on('gameJoined', () => {
    document.querySelector(".intro-wrapper").style.display = "none";
    document.querySelector(".lobby").style.display = "block";
    showGameId(gameId);
})

socket.on('gameJoinError', () => {
    var errorMsg = document.createTextNode("Error: Game ID " + gameId + " was not found.");
    document.querySelector(".joinError").appendChild(errorMsg);
});

socket.on('playerJoined', () => {

});