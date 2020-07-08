const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Game = require('./../client/logic/game.js');

const app = express();

const clientPath = `${__dirname}/../client`;
console.log(`Serving static from ${clientPath}`);

app.use(express.static(clientPath));

const server = http.createServer(app);

const io = socketio(server);

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
            name: player.name,
            alive: player.alive
        })
    }
    let returnObject = {
        turn: userTurn,
        turnName: name,
        hand: hand.hand,
        deckLength: game.deck.length,
        stack: game.playStack,
        players: players,
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
    socket.on('message', (text) => {
        io.emit('message', text);
    });

    // On game disconnect:
    socket.on('disconnect', () => {
        if (!(socket.id in allClients)) {
            return;
        }

        var room = allClients[socket.id];

        if (games[room].clients.length === 1) {
            delete games[room];
            return;
        }

        for (var i = 0; i < games[room].clients.length; i++) {
            if (games[room].clients[i].clientId === socket.id) {
                if (games[room].clients[i].isAdmin) {
                    games[room].clients[i+1].isAdmin = true;
                }
                games[room].clients.splice(i, 1);
            }
        }
        socket.leave(room);
        
        io.in(room).emit('playerChanged', games[room].clients);
        delete allClients[socket.id];   
    });
    // On game create, automatically add the user to the game.
    socket.on('create', (payload) => {
        const clientId = payload.clientId;
        const name = payload.name;
        const gameId = guid();
        while (gameId in games) {
            gameId = guid();
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
        const gameId = payload.gameId;

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

    // Move made
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
        }

        if (status === 1 || status === 2) {
            console.log("message");
            io.to(gameId).emit('bombDrawn', client.name);

            if (status === 2 && game.playersAlive === 1) {
                // Game over
                io.to(gameId).emit('gameOver', room.clients, game.playerList);
            }
        }
        sendToAll(room.clients, game);
    });
});

server.on('error', (err) => {
    console.error('Server error:', err);
});

server.listen(8080, () => {
    console.log('Exploding Kittens started on 8080');
});