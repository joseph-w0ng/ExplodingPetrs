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
        const game = games[gameId];
        game.clients.push({
            "clientId": clientId,
            "name": name,
            "isAdmin": true
        })

        allClients[clientId] = gameId;

        socket.join(gameId);
        io.to(payload.clientId).emit('gameCreated', gameId);
        io.to(payload.clientId).emit('gameJoined', game.clients);
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
        const game = games[gameId];
        
        if (game.started) {
            io.to(payload.clientId).emit('alreadyStarted');
            return;
        }

        // Max players = 8
        if (game.clients.length >= 8) {
            io.to(payload.clientId).emit('gameFull');
            return;
        }

        for (var i = 0; i < game.clients.length; i++) {
            if (trim(game.clients[i].name) === trim(name) || name === '') {
                io.to(clientId).emit('invalidName');
                return;
            }
        }
        game.clients.push({
            "clientId": clientId,
            "name": name,
            "isAdmin": false
        });

        allClients[clientId] = gameId;

        io.in(gameId).emit("playerChanged", game.clients);
        socket.join(gameId);
        io.to(clientId).emit("gameJoined", game.clients);
        
    });
    // Chat message
    socket.on('message', (payload) => {
        const chatMsg = payload.name + ": " + payload.message;
        io.to(payload.gameId).emit('newChat', chatMsg);
    });
    // Game ready to start
    socket.on('ready', (gameId) => {
        const game = games[gameId];
        game.game = new Game(game.clients);
        game.started = true;
        io.to(gameId).emit('gameStarted', game.game);
    });

    // Move made
    socket.on('move', (gameId) => {

    });
});

server.on('error', (err) => {
    console.error('Server error:', err);
});

server.listen(8080, () => {
    console.log('Exploding Kittens started on 8080');
});