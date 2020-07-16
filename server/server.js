const http = require('http');
const express = require('express');

const PORT = process.env.PORT || 8080;

const Game = require('./../client/logic/game.js');

const app = express();

const clientPath = `${__dirname}/../client`;
console.log(`Serving static from ${clientPath}`);

app.use(express.static(clientPath));

const server = http.createServer(app);
const io = require('socket.io')(server, {
    pingTimeout: 60000,
});

// Keep track of which game each client is in.
const allClients = {};
const games = {};

// Helper functions
const createClientGame = (clientId, game) => {
    let userTurn = game.playerList[game.turnCounter].clientId;
    let name = game.playerList[game.turnCounter].name;
    let hand = game.playerList.find(obj => {
        return obj.clientId === clientId;
    });

    let players = [];
    for (let player of game.playerList) {
        players.push({
            clientId: player.clientId,
            name: player.name,
            alive: player.alive,
            cards: player.hand.length
        })
    }
    let returnObject = {
        turn: userTurn,
        turnName: name,
        hand: hand.hand,
        deckLength: game.deck.length,
        stack: game.playStack,
        players: players,
        attackTurns: game.attackTurns,
    };

    return returnObject;
};

const trim = (str) => {
    return String(str).replace(/^\s+|\s+$/g, '');
};

 const guid = () => {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < 6; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 };
// Generating game ID, definitely not copy/pasted from Stack Overflow
function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
const sendToAll = (clientList, game) => {
    for (let client of clientList) {
        io.to(client.clientId).emit('gameStateUpdated', createClientGame(client.clientId, game));
    }
};
// const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();


io.on('connection', (socket) => {

    // On game disconnect:
    socket.on('disconnect', () => {
        if (!(socket.id in allClients)) {
            return;
        }

        let gameId = allClients[socket.id];
        let room = games[gameId];
        let game = room.game;

        if (room.clients.length === 1) {
            delete games[gameId];
            return;
        }


        let playerName = null;
        if (room.started) {
            let index = game.playerList.findIndex(player => player.clientId === socket.id);
            game.playerList[index].alive = false;
            playerName = game.playerList[index].name;
            game.playersAlive -= 1;
            if (game.playersAlive === 1) {
                io.in(gameId).emit('gameOver', room.clients, game.playerList);
            }
            else {
                sendToAll(room.clients, game);
            }
        }

        else {
            let i = room.clients.findIndex(player => player.clientId === socket.id);
            playerName = room.clients[i].name;
        }

        for (var i = 0; i < room.clients.length; i++) {
            if (room.clients[i].clientId === socket.id) {
                if (room.clients[i].isAdmin) {
                    room.clients[i+1].isAdmin = true;
                }
                room.clients.splice(i, 1);
            }
        }

        socket.leave(room);

        let message = playerName + " has left the game."
        io.in(gameId).emit('newChat', message);
        io.in(gameId).emit('playerChanged', room.clients);
        delete allClients[socket.id];   
    });

    // On game create, automatically add the user to the game.
    socket.on('create', (payload) => {
        const clientId = payload.clientId;
        const name = payload.name;
        const gameId = guid().toUpperCase();
        while (gameId in games) {
            gameId = guid().toUpperCase();
        }

        games[gameId] = {
            "id": gameId,
            "clients": [],
            "admin": clientId,
            "adminName": name,
            "game": null,
            "started": false
        };
        // On start game, create new game
        const room = games[gameId];
        room.clients.push({
            "clientId": clientId,
            "name": name,
            "isAdmin": true
        })

        allClients[clientId] = gameId;

        socket.join(gameId);
        io.to(payload.clientId).emit('gameCreated', gameId);
        io.to(payload.clientId).emit('gameJoined', room.clients);
    });

    // On game join
    socket.on('join', (payload) => {
        const clientId = payload.clientId;
        const name = payload.name;
        const gameId = payload.gameId.toUpperCase();

        if (!(gameId in games)) {
            io.to(payload.clientId).emit('gameJoinError');
            return;
        }
        const room = games[gameId];
        
        if (room.started) {
            io.to(payload.clientId).emit('alreadyStarted');
            return;
        }

        // Max players = 8
        if (room.clients.length >= 8) {
            io.to(payload.clientId).emit('gameFull');
            return;
        }

        for (var i = 0; i < room.clients.length; i++) {
            if (trim(room.clients[i].name) === trim(name) || name.length === 0) {
                io.to(clientId).emit('invalidName');
                return;
            }
        }
        room.clients.push({
            "clientId": clientId,
            "name": name,
            "isAdmin": false
        });

        allClients[clientId] = gameId;

        let message = name + " has joined the game."
        io.in(gameId).emit('newChat', message);
        io.in(gameId).emit("playerChanged", room.clients);
        socket.join(gameId);
        io.to(clientId).emit("gameJoined", room.clients);
        
    });
    // Chat message
    socket.on('message', (payload) => {
        const chatMsg = payload.name + ": " + payload.message;
        io.in(payload.gameId).emit('newChat', chatMsg);
    });
    // Game ready to start
    socket.on('ready', (gameId) => {
        const room = games[gameId];
        room.game = new Game(room.clients);
        const game = room.game;
        room.started = true;

        for (let client of room.clients) {
            io.to(client.clientId).emit('gameStarted', createClientGame(client.clientId, game));
        }
    });

    // Player chose a place to defuse
    socket.on('defused', (index, gameId) => {
        const room = games[gameId];
        const game = room.game;
        game.playDefuse(index);
        sendToAll(room.clients, game);
        io.in(gameId).emit('bombOver');
    });

    socket.on('fiveCats', (gameId, card) => {
        const room = games[gameId];
        const game = room.game;
        game.takeFromStack(card);
        sendToAll(room.clients, game);
    });

    // origin is a player
    socket.on('targetSelected', (origin, id, gameId, card=null) => {
        // card = null -> two cats or favor
        // card != null -> 3 cats

        const room = games[gameId];
        const game = room.game;

        let init = game.playerList.find(p => p.clientId === origin);
        let player = game.playerList.find(p => p.clientId === id);

        if (game.playStack[game.playStack.length - 1].type === "action") {
            io.to(id).emit('favor', init);
            io.in(gameId).emit('favorAsked', init.name, player.name);
        }

        else {
            game.steal(origin, id, card);
            io.in(gameId).emit('cardStolen', init.name, player.name);
            sendToAll(room.clients, game);
            io.to(origin).emit('cardReceived');
        }
        
    });

    socket.on('giveCard', (gameId, card, origin, destination) => {
        const room = games[gameId];
        const game = room.game;

        game._transferCard(card, origin, destination);
        io.to(destination).emit('cardReceived');
        io.to(origin).emit('cardReceived');
        sendToAll(room.clients, game);

    });

    socket.on('cardPlayed', (cardsToPlay, gameId, clientId) => { // cards are just card names
        const room = games[gameId];
        const game = room.game;
        let status = game.playCards(cardsToPlay);

        switch(status) {    
            case 0:
                break;
            case 1:
                io.to(clientId).emit("invalidMove");
                break;
            case 2: 
                let clientPlayers = [];
                for (let player of game.playerList) {
                    if (player.alive) {
                        clientPlayers.push({
                            name: player.name,
                            id: player.clientId
                        })
                    }
                }
                io.to(clientId).emit("selectTarget", clientPlayers);
                break;
            case 3: 
                let clients = [];
                    for (let player of game.playerList) {
                        if (player.alive) {
                            clients.push({
                                name: player.name,
                                id: player.clientId
                            })
                        }
                    }
                    io.to(clientId).emit("selectTarget", clients, true);
                break;
            case 4: 
                io.to(clientId).emit("fiveCats", game.playStack.slice(0, game.playStack.length - 5));
                break;
            case 5: 
                let deckCards = [];
                for (var i = game.deck.length-1; i > game.deck.length-4 ;i--) {
                    deckCards.push(game.deck[i]);
                }
                io.to(clientId).emit("showFuture", deckCards);
                break;
            case 6:
                sendToAll(room.clients, game);
                break;

        }

        sendToAll(room.clients, game);
    });
    // Turn end
    socket.on('endTurn', (gameId) => {
        const room = games[gameId];
        const game = room.game;
        let status = game.endTurn();
        let client = game.playerList[game.turnCounter];

        if (status === 1) {
            // Also show that a player drew an exploding kitten
            let index = client.hand.findIndex(card => card.name === "defuse");
            client.hand.splice(index, 1);
            io.to(client.clientId).emit('defuse', createClientGame(client.clientId, game));
            game.playStack.push({
                name: "defuse",
                type: "action"
            })
        }

        if (status === 1 || status === 2) {
            io.to(gameId).emit('bombDrawn', client.name);

            if (status === 2 && game.playersAlive === 1) {
                // Game over
                io.to(gameId).emit('gameOver', room.clients, game.playerList);
            }
        }
        io.to(gameId).emit("hideElements");
        sendToAll(room.clients, game);
    });
});

server.on('error', (err) => {
    console.error('Server error:', err);
});

server.listen(PORT, () => {
    console.log('Exploding Petrs started on ' + PORT);
});