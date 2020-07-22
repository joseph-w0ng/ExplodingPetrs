const { isEmptyObject } = require("jquery");

module.exports = class Game {
    // players = clients
    constructor(players) {
        this.drawFromBottom = false;
        this.turnCounter = 0;
        this.playerList = []; // array of objects
        this.deck = [];
        this.playStack = [];
        this._initializeDeck(players.length); 
        this.attackTurns = 0;
        this.shuffle();
        this.playersAlive = players.length;
        // initialize playerList and deal everyone a hand
        for (var i = 0; i < players.length; i++) {
            this.playerList.push({
                clientId: players[i].clientId,
                name: players[i].name,
                alive: true,
                hand: []
            })

            this.playerList[i].hand.push({
                name: "Defuse",
                type: "action"
            })
            // deal each player a hand of 7 cards (total)
            for (var j = 0; j < 6; j++) {
                this.playerList[i].hand.push(this.deck.pop());
            }
        }
        this._addBombs(players.length-1);
        // this._debugDeck(players.length-1);
    }

    takeFromStack(card) {
        let player = this.playerList[this.turnCounter];
        let index = this.playStack.findIndex(c => c.name === card);
 
        let cardToTake = this.playStack[index];
        this.playStack.splice(index, 1);

        player.hand.push(cardToTake);
    }

    _hasDuplicates(array) {
        return (new Set(array)).size !== array.length;
    }

    _addBombs(bombs) {
        // insert bombs at random locations
        for (var i = 0; i < bombs; i++) {
            this.deck.splice(Math.random() * this.deck.length, 0, {
                name: "Exploding Petr",
                type: "bomb"
            })
        }
    }

    _debugDeck() {
        this.deck = [];
        for (let i in this.playerList) {
            this.deck.push({
                name: "Exploding Petr",
                type: "bomb"
            });
        }
    }

    _initializeDeck(numPlayers) {
        // push action and cat cards
        for (var i = 0; i < numPlayers - 1; i++) {   
            this.deck.push({
                name: "Attack",
                type: "action"
            });
        }

        for (var i = 0; i < 2*numPlayers - 1; i++) {
            this.deck.push({
                name: "Skip",
                type: "action"
            });

            this.deck.push({
                name: "Shuffle",
                type: "action"
            });

            this.deck.push({
                name: "See the Future",
                type: "action"
            });

            this.deck.push({
                name: "Draw from the Bottom",
                type: "action"
            });

            this.deck.push({
                name: "Favor",
                type: "action"
            });

            // image needed
            this.deck.push({
                name: "Boba Petr",
                type: "cat"
            });

            // image needed
            this.deck.push({
                name: "Dark Petr",
                type: "cat"
            });

            // image needed
            this.deck.push({
                name: "In n Out Petr",
                type: "cat"
            });

            // image needed
            this.deck.push({
                name: "Petr the Anteater",
                type: "cat"
            });

            // image needed
            this.deck.push({
                name: "Panda Petr",
                type: "cat"
            });
        }
        // Add an extra defuse to the deck
        this.deck.push({
            name: "Defuse",
            type: "action"
        })
    };

    // Stolen off Stack Overflow so I don't have to write my own shuffle function
    shuffle() {
        var j, x, i;
        for (i = this.deck.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = this.deck[i];
            this.deck[i] = this.deck[j];
            this.deck[j] = x;
        }
    }

    isValidCombination(cards) {
        if (cards.length === 1) {
            if (cards[0].type != "action" || cards[0].name === "Defuse") {
                return false;
            }
            return true;
        }

        else if (cards.length === 2) {
            if (cards[0].type === "cat" && cards[0].name === cards[1].name) {
                return true;
            }
            return false;
        }

        else if (cards.length === 3) {
            if (cards[0].type === "cat" && cards[0].name === cards[1].name && cards[1].name === cards[2].name) {
                // use name and target
                return true;
            }
            return false;
        }

        else if (cards.length === 5) {
            if (!this._hasDuplicates(cards) && this.playStack.length >= 1) {
                return true;
            }
            return false;
        }
        return false;
    }

    _transferCard(card, origin, destination) {
        let origOwner = this.playerList.find(p => p.clientId === origin);
        let newOwner = this.playerList.find(p => p.clientId === destination);
         
        let cardIndex = origOwner.hand.findIndex(c => c.name === card);
        let cardToMove = origOwner.hand[cardIndex];

        origOwner.hand.splice(cardIndex, 1);
        newOwner.hand.push(cardToMove);
    }

    steal(origin, destination, card) {
        // origin = player who used the cats
        // destination = player who was targeted
        let origOwner = this.playerList.find(p => p.clientId === destination);
        let newOwner = this.playerList.find(p => p.clientId === origin);

        let index = null;
        if (card != null) {
            index = origOwner.hand.findIndex(c => c.name === card);
            if (index === -1) {
                return;
            }
        }

        else {
            index = Math.floor(Math.random() * origOwner.hand.length);
        }
        
        let cardToMove = origOwner.hand[index];

        origOwner.hand.splice(index, 1);
        newOwner.hand.push(cardToMove);
    }

    playCards(cards) { 
        // Return codes:
        // 0: everything is fine
        // 1: invalid move
        // 2: target needed
        // 3: target + card needed
        // 4: card needed
        // 5: something needs to be displayed
        // 6: turn changed
        // 7: invalid packet
        // Action card logic
        let player = this.playerList[this.turnCounter];
        let playedCards = [];
        let indices = [];
        let subtract = 0;
        let seen = {};

        for (let card of cards) {
            let index = -1;
            if (!(card in seen)) {
                index = player.hand.findIndex(c => c.name === card);
                if (index == -1) return 7;
                seen[card] = index;
            }
            else {
                index = player.hand.findIndex((c, i) => c.name === card && i > seen[card]);
                if (index == -1) return 7;
                seen[card] = index;
            }
            playedCards.push(player.hand[index]);
            indices.push(index);
        }

        if (!this.isValidCombination(playedCards)) {
            return 1;
        }

        indices.sort();

        for (let index of indices) {
            this.playStack.push(player.hand[index - subtract]);
            player.hand.splice(index-subtract, 1);
            subtract += 1;
        }


        if (playedCards.length === 1) {
            switch(playedCards[0].name) {
                case "Attack":
                    this.attackTurns += 2;
                    this.turnCounter = (this.turnCounter + 1) % this.playerList.length;
                    return 6;
                // TODO
                case "Favor":
                    return 2;
                case "skip":
                    this.attackTurns -= 1; 
                    if (this.attackTurns <= 1) {
                        this.turnCounter = (this.turnCounter + 1) % this.playerList.length;
                    }
                    return 6;
                case "Shuffle":
                    this.shuffle();
                    return 0;
                case "See the Future":
                    return 5;
                case "Draw from the Bottom":
                    this.drawFromBottom = true;
                    return 0;
            }
        }

        // TODO
        else if (playedCards.length === 2) {
            return 2;
        }

        else if (playedCards.length === 3) {
            return 3;
        }

        else if (playedCards.length === 5) {
            return 4;
        }
        return 1;
    }

    draw() {
        return this.deck.pop();
    }

    drawBottom() {
        return this.deck.shift();
    }

    playDefuse(index) {
        this.deck.splice(this.deck.length-index+1, 0, {
            name: "Exploding Petr",
            type: "bomb"
        })

        if (this.attackTurns > 0) {
            this.attackTurns -= 1;
            return;
        }
        this.turnCounter = (this.turnCounter + 1) % this.playerList.length;
    }

    endTurn() {
        // Defuse logic
        // returns 0 if everything is fine
        // returns 1 if action needed (defuse)
        // returns 2 if player died
        let player = this.playerList[this.turnCounter];
        while (!player.alive) {
            this.turnCounter = (this.turnCounter + 1) % this.playerList.length;
        }

        let card = null;
        if (this.drawFromBottom) {
            this.drawFromBottom = false;
            card = this.drawBottom();
        }
        else {
            card =this.draw();
        }
        

        if (card.type === "bomb") {
            if (!player.hand.some(item => item.name === 'Defuse')) {
                this.playerList[this.turnCounter].alive = false;
                this.playersAlive -= 1;
                this.playStack.push(card);
                return 2;
            }
            else {
                return 1;
            }
        }

        else {
            player.hand.push(card);
        }

        if (this.attackTurns > 0) {
            this.attackTurns -= 1;
            return 0;
        }
        this.turnCounter = (this.turnCounter + 1) % this.playerList.length;
        return 0;
    }
};