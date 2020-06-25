const onFormSubmitted = (e) => {
    e.preventDefault();
    const input = document.querySelector('#chat');
    const text = input.value;
    input.value = '';

    socket.emit('message', text);
}

const socket = io();
// socket.on('message', writeEvent);

// HTML elements
let clientId = null;
let gameId = null;

const createButton = document.getElementById("create");
const joinButton = document.getElementById("join");
const gameIdText = document.getElementById("gameId");
const playerName = document.getElementById("playerName");

// Event handling
createButton.addEventListener("click", e => {
    const payLoad = {
        "clientId": clientId,
        "name": playerName.value
    }; 
    playerName.value = '';
    socket.emit('create', payLoad);
});

joinButton.addEventListener("click", e => {
    const payLoad = {
        "clientId": clientId,
        "gameId": gameIdText.value,
        "name": playerName.value
    };

    playerName.value = '';
    gameIdText.value = '';
    socket.emit('join', payLoad);
})

// document.querySelector('#chat-form').addEventListener('submit', onFormSubmitted);
