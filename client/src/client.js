// HTML elements
const socket = io();

let clientId = null;
socket.on('connect', () => {
    clientId = socket.id;
})

let gameId = null;
let name = null;
let currentTurn = false;
let tempAction = null;
let tempOrig = null;
let lastPlayedCards = null;
let alive = true;
let favorRecipient = null;

const gameIdText = document.getElementById("gameId");
const playerName = document.getElementById("playerName");
const leaveButton = document.getElementById("leave");
const startButton = document.getElementById("start");
const sendButton = document.getElementById("send");
const messageToSend = document.getElementById("chatMsg");

// Constant variables

const cardToImageMap = new Map([
    ["Defuse", "images/defuse.svg"],
    ["Exploding Petr", "images/explodingpetr.svg"],
    ["Skip", "images/skip.svg"],
    ["Attack", "images/attack.svg"],
    ["Favor", "images/favor.svg"],
    ["See the Future", "images/seefuture.svg"],
    ["Shuffle", "images/shuffle.svg"],
    ["Draw from the Bottom", "images/drawbottom.svg"],
    ["Boba Petr", "images/bobapetr.svg"],
    ["Dark Petr", "images/darkpetr.svg"],
    ["In n Out Petr", "images/innoutpetr.svg"],
    ["Petr the Anteater", "images/origpetr.svg"],
    ["Panda Petr", "images/pandapetr.svg"],
]);


// Helper functions
function strip(html){
    var doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
 }

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
    document.getElementById("displayId").innerHTML = "Game ID: <b>" + id + "</b>";
};

const updatePlayers = (players) => {
    $("#playerList").empty();
    for (let player of players) {
        if (player.isAdmin) {
            if (player.clientId === clientId) {
                $("<li>" + strip(player.name) + " (Host, You)</li>").appendTo("#playerList");
            }
            else {
                $("<li>" + strip(player.name) + " (Host)</li>").appendTo("#playerList");
            }
        }
        else if (player.clientId === clientId) {
            $("<li>" + strip(player.name) + " (You) </li>").appendTo("#playerList");
        }
        else {
            $("<li>" + strip(player.name) + "</li>").appendTo("#playerList");
        }
        
    }
};

// TODO: change so that client only sees what is necessary, no need to send entire game
const updateGameState = (game) => { // client game object
    $("#actions").show();
    if (game.turn === clientId) {
        $("#turn").html("Your turn!");
        $("#endTurn").show();
        $("#play").show();
        currentTurn = true;
    }

    else {
        $("#play").hide();
        $("#endTurn").hide();
        $("#turn").html(game.turnName + "'s turn!");
        currentTurn = false;
    }
    if (game.stack.length > 0) {
        document.getElementById("stack").src = cardToImageMap.get(game.stack[game.stack.length - 1].name);
    }

    $("#hand").empty();
    for (let card of game.hand) {
        let src = cardToImageMap.get(card.name);
        $("#hand").prepend($('<img src="' + src + '" class=card alt="'+card.name+'"/>'));
    }
    
    $("#cardsLeft").html(game.deckLength + " cards remaining.");
    $("#playersAlive").empty();
    

    for (let player of game.players) {
        if (player.alive) {
            if (player.clientId === clientId) {
                $("#playersAlive").append('<li>' + strip(player.name) + ' (You)</li>');
            }
            else {
                $("#playersAlive").append('<li>' + strip(player.name) + ' (' + player.cards + ' cards)</li>');
            }

            $("#hand").show();
            $("#turn").show();
            
        }
        else {
            $("#playersAlive").append('<li><del>' + player.name + '</del></li>');
        }
        if (player.clientId === clientId && !player.alive) {
            $("#hand").hide();
            $("#turn").hide();
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
    $("#createOption").toggleClass("optionSelected");
    $("#joinOption").toggleClass("unselected");
    $('#gameOver').hide();
    $("#gameElements").hide();
    $("#gameContainer").hide();
    $("#target").hide();
    $("#order").hide();
    $("#future").hide();
    $("#pickFromStack").hide();
    $("#info").hide();
    $("#sayNo").hide();
    $("#favor").hide();
    $("#waiting").hide();
    $("#fiveCats").hide();
    $("#gameId").attr("disabled", true);

    $("#createOption").click(() => {
        if (!$("#gameId").is(":disabled")) {
            $("#gameId").attr("disabled", true);
            $("#createOption").toggleClass("optionSelected");
            $("#joinOption").toggleClass("optionSelected");
            $("#createOption").toggleClass("unselected");
            $("#joinOption").toggleClass("unselected");
        }
        
    });

    $("#joinOption").click(() => {
        if ($("#gameId").is(":disabled")) {
            $("#gameId").attr("disabled", false);
            $("#createOption").toggleClass("optionSelected");
            $("#joinOption").toggleClass("optionSelected");
            $("#createOption").toggleClass("unselected");
            $("#joinOption").toggleClass("unselected");
        }
    });

    $("#enterGame").click(() => {
        gameId = gameIdText.value;
        name = $.trim(playerName.value)

        if (strip(name).length === 0) {
            $("#errorMsg").html('Please enter a name.');
            return;
        }

        else {
            $("#errorMsg").html('');
        }

        let payLoad = null;
        if ($("#gameId").is(":disabled")) {
            payLoad = {
                "clientId": clientId,
                "name": name
            }; 
            socket.emit('create', payLoad);
        }
        else {
            payLoad = {
                "clientId": clientId,
                "gameId": $.trim(gameId),
                "name": name
            };
            socket.emit('join', payLoad);
        }
        gameIdText.value = '';
        playerName.value = '';

        $("#intro-wrapper").hide();
        $("#lobby").show();
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
        $("#future").hide();
        $("#infoText").html('');
        $("#invalidCard").html('');
        socket.emit('endTurn', gameId);
    });

    $("#hand").on('click', 'img', function() {
        $(this).toggleClass("selected");
    });

    $("#submitIndex").click(() => {
        let index = $('#orderSelect').val();
        $("#order").hide();
        $("#invalidOrder").hide();
        $("#turnContainer").show();
        socket.emit('defused', index, gameId);
    });

    $("#play").click(() => {
        cards = []; // just card names
        $("#invalidCard").html('');
        $(".selected").each(function() {
            cards.push($(this).attr("alt"));
        });
        $("#future").hide();
        
        socket.emit('cardPlayed', cards, gameId, clientId);
    });

    $("#leaveInGame").click(() => {
        $(".createForm").hide();
        $(".joinForm").hide();
        $("#gameContainer").hide();

        gameId = null;

        socket.disconnect();

        $("#intro-wrapper").show();
        $("#lobby").hide();
        $("#chat").hide();
        socket.connect();
    });

    playerName.addEventListener("keyup", (e) => {
        if (e.keyCode === 13) {
            $("#enterGame").click();
        }
    })

    $("#submitTarget").click(() => {
        let id = $("#targetSelect").val();
        $("#targetText").hide();
        $("#targetSelect").hide();
        $("#submitTarget").hide();
        $("#waiting").show();
        if ($("#cardChooser").is(":visible")) {
            let card = $("#cardChooser").val();
            socket.emit('targetSelected', clientId, id, gameId, card);
        }
        else {
            socket.emit('targetSelected', clientId, id, gameId);
        }
       $("#actions").show();
    });

    $("#give").click(() => {
        let card = [];
        $(".selected").each(function() {
            card.push($(this).attr("alt"));
        });
        if (card.length != 1) {
            $("#invalidSelect").html("Choose one card ONLY.");
            return;
        }
        socket.emit("giveCard", gameId, card[0], clientId, favorRecipient);
        $("#favor").hide();

    });

    $("#stackSubmit").click(() => {
        $("#fiveCats").hide();
        let card = $("#stackChooser").val(); 
        socket.emit('fiveCats', gameId, card);
    });

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
        $("#instructions").hide();
        alive = true;
        document.getElementById("stack").src = "images/empty.svg";
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
        // $("#turnContainer").hide();
        updateGameState(game);
        $("#order").show();
        $("#actions").hide();
        $("#orderSelect").empty();
        $("#orderSelect").append($('<option>', {
            value: 1,
            text: "Top of the deck"
        }))
        for (var i = 2; i <= game.deckLength; i++) {
            $("#orderSelect").append($('<option>', {
                value: i,
                text: i
            }))
        }
        if (game.deckLength > 0) {
            $("#orderSelect").append($('<option>', {
                value: i,
                text: "Bottom of the deck"
            }))
    
            $("#orderSelect").append($('<option>', {
                value: Math.floor(Math.random() * game.deckLength + 1),
                text: "Random"
            }))
        }
    });

    socket.on('bombDrawn', (playerName) => {
        $("#infoText").html(playerName + " has drawn an Exploding Petr!");
        $("#info").show();
        $("#infoText").show();
    });

    socket.on('bombOver', () => {
        $("#infoText").html('');
        $("#info").hide();
    });

    socket.on('gameOver', (clients, players) => {
        let winner = players.find(p => p.alive);
        $("#winner").html("Game over! " + winner.name + " won the game!");
        $("#infoText").html("");
        $("#info").hide();
        $("#gameOver").show();
        $("#gameContainer").hide();
        $("#lobby").show();
        updatePlayers(clients);
        showStartOption(clients);
    });

    socket.on('showFuture', (deckCards) => {
        // $("<li>" + player.name + " (Host, You)</li>").appendTo("#playerList");
        $("#future").show();

        for (let card of deckCards) {
            let src = cardToImageMap.get(card.name);
            $("#futureCards").append($('<img src="' + src + '" height="200" class="cardFuture"/>'))
        }
    });

    socket.on('favor', (player) => {
        $("#favorInfo").html(player.name + " has asked you for a favor!");
        favorRecipient = player.clientId;
        $("#favor").show();
    });

    socket.on('favorAsked', (stealer, victim) => {
        if (!$("#favor").is(":visible")) {
            $("#info").show();
            $("#infoText").html(stealer + " has asked " + victim + " for a favor!");
        }
    });

    socket.on('cardStolen', (stealer, victim) => {
        $("#info").show();
        $("#infoText").html(stealer + " has taken a card from " + victim + "!");
    });

    socket.on('selectTarget', (players, threeCats=false) => {
        $("#actions").hide();
        $("#targetSelect").empty();
        for (let player of players) {
            if (player.id != clientId) {
                $("#targetSelect").append($('<option>', {
                    value: player.id,
                    text: player.name
                }))
            }
        }
        if (threeCats) {
            $("#cardChooser").show();
            $("#cardLabel").show();
        }
        else {
            $("#cardChooser").hide();
            $("#cardLabel").hide();
        }
        $("#target").show();
    });

    socket.on("fiveCats", (stack) => {
        stack = new Set(stack);
        for (let card of stack) {
            $("#stackChooser").append($('<option>', {
                value: card.name,
                text: card.name
            }))
        }
        $("#fiveCats").show();
    });

    socket.on('invalidMove', () => {
        $("#invalidCard").html("Invalid card combination played.")
    });

    socket.on('cardReceived', () => {
        $("#targetText").show();
        $("#targetSelect").show();
        $("#submitTarget").show();
        $("#waiting").hide();
        $("#target").hide();
    });

    socket.on("hideElements", () => {
        $("#info").hide();
        $("#infoText").html('');
    });
});

