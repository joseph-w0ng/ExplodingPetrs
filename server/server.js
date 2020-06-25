const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();

const clientPath = `${__dirname}/../client`;
console.log(`Serving static from ${clientPath}`);

app.use(express.static(clientPath));

const server = http.createServer(app);

const io = socketio(server);

io.on('connection', (socket) => {
    console.log("Someone has connected!");
    // console.log(socket);
    socket.emit('message', 'You are connected!');

    socket.on('message', (text) => {
        io.emit('message', text);
    });

    socket.on('create', (payload) => {
        const clientId = payload.clientId;
        const gameId = guid();

        io.to(payload.socket).emit('gameCreated', gameId);

    });

    socket.on('join', (payload) => {
    });
});

server.on('error', (err) => {
    console.error('Server error:', err);
});

server.listen(8080, () => {
    console.log('RPS started on 8080');
});

// Generating gamde ID, definitely not copy/pasted from Stack Overflow
function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();