// HTML elements
const socket = io();

let clientId = null;
socket.on('connect', () => {
    clientId = socket.id;
})

let gameId = null;
let name = null;
let currentTurn = false;

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

// Constant variables
// Use cardToImageMap.get(<key>)
// Need to change cat mappings back
const cardToImageMap = new Map([
    ["defuse", "images/defuse.svg"],
    ["kitten", "images/kitten.svg"],
    ["nope", "images/nope.svg"],
    ["skip", "images/skip.svg"],
    ["attack", "images/attack.svg"],
    ["favor", "images/favor.svg"],
    ["see future", "images/seefuture.svg"],
    ["shuffle", "images/shuffle.svg"],
    ["draw bottom", "images/drawbottom.svg"],
    ["cat1", "images/cat1.svg"],
    ["cat2", "images/cat1.svg"],
    ["cat3", "images/cat1.svg"],
    ["cat4", "images/cat1.svg"],
    ["cat5", "images/cat1.svg"],
]);


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

const validOrderInput = (val) => {
    if (parseInt(val) === "NaN") {
        return false;
    }
    if (parseInt(val) > parseInt($("#cardsLeft").html().split(" ")[0]) || parseInt(val) <= 0) {
        return false;
    }
    return true;
};

const updatePlayers = (players) => {
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
const updateGameState = (game) => { // client game object
    // $("#exploded").hide();
    // $("#explodedText").html('');

    if (game.turn === clientId) {
        $("#turn").html("It is your turn!");
        $("#endTurn").show();
        $("#play").show();
        currentTurn = true;
    }

    else {
        $("#play").hide();
        $("#endTurn").hide();
        $("#turn").html("It is " + game.turnName + "'s turn!");
        currentTurn = false;
    }
    if (game.stack.length > 0) {
        document.getElementById("stack").src = cardToImageMap.get(game.stack[game.stack.length - 1].name);
    }

    $("#hand").empty();
    for (let card of game.hand) {
        let src = cardToImageMap.get(card.name);
        $("#hand").prepend($('<img src="' + src + '" class=card alt=idk/>'));
    }
    
    $("#cardsLeft").html(game.deckLength + " cards remaining.");
    $("#playersAlive").empty();
    

    for (let player of game.players) {
        if (player.alive) {
            $("#playersAlive").append('<li>' + player.name + '</li>');
        }
        else {
            $("#playersAlive").append('<li><del>' + player.name + '</del></li>');
        }
        
    }
};

const onFormSubmitted = (e) => {
    e.preventDefault();
    const input = document.getElementById('#chat');
    const text = input.value;
    input.value = '';

    socket.emit('message', text);
};

// Event 
$(document).ready(() => {
    $("#lobby").hide();
    $('#gameOver').hide();
    $(".createForm").hide();
    $(".joinForm").hide();
    $("#gameElements").hide();
    $("#gameContainer").hide();
    $("target").hide();
    $("#order").hide();
    $("#future").hide();
    $("#pickFromStack").hide();
    $("#exploded").hide();

    createOption.addEventListener("click", e => {
        $(".joinForm").hide();
        $(".createForm").show();
    });

    joinOption.addEventListener("click", e => {
        $(".createForm").hide();
        $(".joinForm").show();
    });

    createButton.addEventListener("click", e => {
        name = $.trim(playerName.value)
        const payLoad = {
            "clientId": clientId,
            "name": name
        }; 
        playerName.value = '';
        socket.emit('create', payLoad);

        $("#intro-wrapper").hide();
        $("#lobby").show();
        $("#chat").show();
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
        $("#chat").show();
    });

    leaveButton.addEventListener("click", (e) => {
        $(".createForm").hide();
        $(".joinForm").hide();

        gameId = null;

        socket.disconnect();

        $("#intro-wrapper").show();
        $("#lobby").hide();
        $("#chat").hide();
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

    $("#endTurn").click(() => {
        socket.emit('endTurn', gameId);
    });

    $("#hand").on('click', 'img', function() {
        if (!currentTurn) {
            return;
        }

        $(this).toggleClass("selected");
    });

    $("#submitIndex").click(() => {
        let index = $("#orderVal").val();
        $("#orderVal").val('');
        if (!validOrderInput(index)) {
            let cardsRemaining = $("#cardsLeft").html().split(" ")[0];
            $("#invalidOrder").html("Please enter a valid number between 1 and " + cardsRemaining);
            $("#invalidOrder").show();
            return;
        }
        $("#order").hide();
        $("#invalidOrder").hide();
        
        socket.emit('defused', index, gameId);
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
        $("#intro-wrapper").hide();
        $("#gameElements").show();
        $("#lobby").show();
        $("#errorMsg").html("");
        showGameId(gameId);
        updatePlayers(clients);
        showStartOption(clients);
    });

    socket.on('gameJoinError', () => {
        $("#errorMsg").html("Error: Game ID " + gameId + " was not found.");
    });

    socket.on('gameFull', () => {
        $("#errorMsg").html("Error: Requested game is full, max 8 players.");
    });

    socket.on('invalidName', () => {
        $("#errorMsg").html("Error: Please enter a name that has not already been used.");
    });

    socket.on('alreadyStarted', () => {
        $("#errorMsg").html("Error: Game has already started.");
    })

    socket.on('playerChanged', (clients) => {
        updatePlayers(clients);
        showStartOption(clients);
    });

    socket.on('gameStarted', (game) => { // game is a Game() object
        $("#winner").html('');
        $("#lobby").hide();
        $("#startButton").hide();
        $("#gameContainer").show();
        updateGameState(game);
    });

    socket.on('newChat', (msg) => {
        var node = document.createElement("li");
        node.appendChild(document.createTextNode(msg));
        let parent = document.getElementById("chatBox");
        parent.appendChild(node);
    });

    socket.on('gameStateUpdated', (game) => {
        updateGameState(game);
    });

    socket.on('defuse', (game) => {
        updateGameState(game);
        $("#order").show();
    });

    socket.on('bombDrawn', (playerName) => {
        console.log("here");
        $("#explodedText").html(playerName + " has drawn an exploding kitten!");
        $("#exploded").show();
        $("#explodedText").show();
    });

    socket.on('bombOver', () => {
        $("#explodedText").html('');
        $("#expoded").hide();
    });

    socket.on('gameOver', (clients, players) => {
        let winner = players.find(p => p.alive);
        $("#winner").html("Game over! " + winner.name + " won the game!");
        $("#gameOver").show();
        $("#gameContainer").hide();
        $("#lobby").show();
        updatePlayers(clients);
        showStartOption(clients);
    });

    socket.on('makeMove', () => {

    });

    socket.on('invalidMove', () => {

    });

    socket.on('gameOver', () => {

    });
});

