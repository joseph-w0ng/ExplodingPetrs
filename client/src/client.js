// HTML elements
const socket = io();

let clientId = null;
socket.on('connect', () => {
    clientId = socket.id;
})

let gameId = null;
let name = null;

const playerList = document.getElementById("playerList");
const createOption = document.getElementById("createOption");
const joinOption = document.getElementById("joinOption")
const createButton = document.getElementById("create");
const joinButton = document.getElementById("join");
const gameIdText = document.getElementById("gameId");
const playerName = document.getElementById("playerName");
const leaveButton = document.getElementById("leave");
const startButton = document.getElementById("start");
const sendButton = document.getElementById("send");
const messageToSend = document.getElementById("chatMsg");
const endTurnButton = document.getElementById("endTurn");

// Helper functions
const showStartOption = (clients) => {
    let parent = document.getElementById("startGame")
    let text = document.getElementById("hostText");

    for (var i = 0; i < clients.length; i++) {
        parent.style.display = "block";
        if (clients[i].clientId === socket.id) {
            if (clients[i].isAdmin) {
                if (clients.length >= 2) {
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

const showGameId = (id) => {
    document.getElementById("displayId").innerHTML = "Your game id is: " + id;
};

const updatePlayers = (players, list) => {
    $("#playerList").empty();
    for (let player of players) {
        if (player.isAdmin) {
            if (player.clientId === clientId) {
                $("<li>" + player.name + " (Host, You)</li>").appendTo("#playerList");
            }
            else {
                $("<li>" + player.name + " (Host)</li>").appendTo("#playerList");
            }
        }
        else if (player.clientId === clientId) {
            $("<li>" + player.name + " (You) </li>").appendTo("#playerList");
        }
        else {
            $("<li>" + player.name + "</li>").appendTo("#playerList");
        }
        
    }
};

// TODO: change so that client only sees what is necessary, no need to send entire game
const updateGameState = (game) => { // game object
    console.log(game);
    if (game.playerList[game.turnCounter].clientId === clientId) {
        endTurnButton.style.display = "block";
    }
    else {
        endTurnButton.style.display = "none";
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
    name = $.trim(playerName.value)
    const payLoad = {
        "clientId": clientId,
        "name": name
    }; 
    playerName.value = '';
    socket.emit('create', payLoad);

    document.querySelector(".intro-wrapper").style.display = "none";
    document.querySelector(".lobby").style.display = "block"
    document.querySelector(".chat").style.display = "block";
});

joinButton.addEventListener("click", e => {
    gameId = gameIdText.value;
    name = $.trim(playerName.value)

    const payLoad = {
        "clientId": clientId,
        "gameId": $.trim(gameId),
        "name": name
    };

    playerName.value = '';
    gameIdText.value = '';
    socket.emit('join', payLoad);
    document.querySelector(".chat").style.display = "block";
});

leaveButton.addEventListener("click", (e) => {
    for (let el of document.querySelectorAll(".createForm")) {
        el.style.display = "none";
    }

    for (let el of document.querySelectorAll(".joinForm")) {
        el.style.display = "none";
    }

    gameId = null;

    socket.disconnect();

    document.querySelector(".intro-wrapper").style.display = "block";
    document.querySelector(".lobby").style.display = "none";
    document.querySelector(".chat").style.display = "none";
    socket.connect();

});

startButton.addEventListener("click", (e) => {
    socket.emit('ready', gameId);
});

sendButton.addEventListener("click", (e) => {
    let payload = {
        "gameId": gameId,
        "name": name,
        "message": messageToSend.value
    };
    messageToSend.value = '';
    // Automatically scroll down
    $('#chatBox').stop().animate ({
        scrollTop: $('#chatBox')[0].scrollHeight
    });
    socket.emit('message', payload);
});

messageToSend.addEventListener("keyup", (e) => {
    if (e.keyCode === 13) {
        e.preventDefault();
        sendButton.click();
    }
});

playerName.addEventListener("keyup", (e) => {
    if (e.keyCode === 13) {
        if (document.querySelector(".joinForm").style.display === "none") {
            createButton.click();
        }
        else {
            joinButton.click();
        }
    }
})
// Server events
socket.on('gameCreated', (id) => {
    gameId = id;
});

socket.on('gameJoined', (clients) => {
    document.querySelector(".intro-wrapper").style.display = "none";
    document.querySelector(".lobby").style.display = "block";
    document.getElementById("errorMsg").innerHTML = "";
    showGameId(gameId);
    updatePlayers(clients, playerList);
    showStartOption(clients);
});

socket.on('gameJoinError', () => {
   document.getElementById("errorMsg").innerHTML = "Error: Game ID " + gameId + " was not found.";
});

socket.on('gameFull', () => {
    document.getElementById("errorMsg").innerHTML = "Error: Requested game is full, max 8 players.";
});

socket.on('invalidName', () => {
    // Names should be unique
    document.getElementById("errorMsg").innerHTML = "Error: Please enter a name that has not already been used.";
});

socket.on('alreadyStarted', () => {
    document.getElementById("errorMsg").innerHTML = "Error: Game has already started."
})

socket.on('playerChanged', (clients) => {
    updatePlayers(clients, playerList);
    showStartOption(clients);
});

socket.on('gameStarted', (game) => { // game is a Game() object
    document.querySelector(".lobby").style.display = "none";
    startButton.style.display = "none";
    document.querySelector(".game").style.display = "block";
    updateGameState(game);
});

socket.on('newChat', (msg) => {
    var node = document.createElement("li");
    node.appendChild(document.createTextNode(msg));
    let parent = document.getElementById("chatBox");
    parent.appendChild(node);
});

socket.on('makeMove', () => {

});

socket.on('invalidMove', () => {

});

socket.on('gameOver', () => {

});

