// HTML elements
const socket = io();

let clientId = null;
socket.on('connect', () => {
    clientId = socket.id;
})

let gameId = null;

const playerList = document.getElementById("playerList");
const createOption = document.getElementById("createOption");
const joinOption = document.getElementById("joinOption")
const createButton = document.getElementById("create");
const joinButton = document.getElementById("join");
const gameIdText = document.getElementById("gameId");
const playerName = document.getElementById("playerName");
const leaveButton = document.getElementById("leave");
const startButton = document.getElementById("start");

// Helper functions
const showStartOption = (clients) => {
    let parent = document.getElementById("startGame")
    let text = document.getElementById("hostText");

    for (var i = 0; i < clients.length; i++) {
        parent.style.display = "block";
        if (clients[i].clientId === socket.id) {
            if (clients[i].isAdmin) {
                if (clients.length >= 4) {
                    startButton.style.display = "block";
                    text.innerHTML = "You are the host! Press start when ready to begin!";
                }
                else {
                    startButton.style.display = "none";
                    text.innerHTML = "You are the host! Waiting for enough players to join...";
                }
            }
            else {
                text.innerHTML = "Waiting for your host to start the game..."
            }
            parent.appendChild(text);
            break;
        }
    }

}
const showChat = () => {

};

const hideChat = () => {

};

const showGameId = (id) => {
    var displayGameId = document.createTextNode("Your game id is: " + id);
    document.getElementById("displayId").appendChild(displayGameId);
};

const updatePlayers = (players, list) => {
    $("#playerList").empty();
    for (let player of players) {
        if (player.isAdmin) {
            $("<li>" + player.name + " (Host)</li>").appendTo("#playerList");
        }
        else {
            $("<li>" + player.name + "</li>").appendTo("#playerList");
        }
        
    }
};

const onFormSubmitted = (e) => {
    e.preventDefault();
    const input = document.querySelector('#chat');
    const text = input.value;
    input.value = '';

    socket.emit('message', text);
};

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
        "name": $.trim(playerName.value)
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
        "gameId": $.trim(gameId),
        "name": $.trim(playerName.value)
    };

    playerName.value = '';
    gameIdText.value = '';
    socket.emit('join', payLoad);
});

leaveButton.addEventListener("click", (e) => {
    for (let el of document.querySelectorAll(".createForm")) {
        el.style.display = "none";
    }

    for (let el of document.querySelectorAll(".joinForm")) {
        el.style.display = "none";
    }

    gameId = null;
    socket.emit('disconnect');

    document.querySelector(".intro-wrapper").style.display = "block";
    document.querySelector(".lobby").style.display = "none";

});
// Server events
socket.on('gameCreated', (id) => {
    gameId = id;
});

socket.on('gameJoined', (clients) => {
    document.querySelector(".intro-wrapper").style.display = "none";
    document.querySelector(".lobby").style.display = "block";
    showGameId(gameId);
    updatePlayers(clients, playerList);
    showStartOption(clients);
});

socket.on('gameJoinError', () => {
    var errorMsg = document.createTextNode("Error: Game ID " + gameId + " was not found.");
    document.querySelector(".joinError").appendChild(errorMsg);
});

socket.on('gameFull', () => {
    document.getElementById("errorMsg").innerHTML = "Error: Requested game is full, max 8 players.";
});

socket.on('invalidName', () => {
    // Names should be unique
    document.getElementById("errorMsg").innerHTML = "Error: Please enter a name that has not already been used.";
});

socket.on('playerChanged', (clients) => {
    updatePlayers(clients, playerList);
    showStartOption(clients);
});


