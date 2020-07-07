const { isEmptyObject } = require("jquery");

module.exports = class Game {
    // players = clients
    constructor(players) {
        this.turnCounter = 0;
        this.playerList = []; // array of objects
        this.deck = [];
        this.playStack = [];
        this._initializeDeck(players.length); 
        this.attackTurns = 0;
        this.shuffle();
        this.drawFromBottom = false;
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
                name: "defuse",
                type: "action"
            })
            // deal each player a hand of 5 cards (total)
            for (var j = 0; j < 4; j++) {
                this.playerList[i].hand.push(this.deck.pop());
            }
        }
        this._addBombs(players.length-1);
        this._debugDeck(players.length-1);
    }

    toString() {
        return String(this.turnCounter);
    }

    _hasDuplicates(array) {
        return (new Set(array)).size !== array.length;
    }

    _addBombs(bombs) {
        // insert bombs at random locations
        for (var i = 0; i < bombs; i++) {
            this.deck.splice(Math.random() * this.deck.length, 0, {
                name: "kitten",
                type: "bomb"
            })
        }
    }

    _debugDeck(numPlayers) {
        this.deck = [];
        this._addBombs(4);
    }

    _initializeDeck(numPlayers) {
        // push action and cat cards
        for (var i = 0; i < numPlayers - 1; i++) {   
            this.deck.push({
                name: "attack",
                type: "action"
            });

            this.deck.push({
                name: "skip",
                type: "action"
            });

            this.deck.push({
                name: "shuffle",
                type: "action"
            });

            this.deck.push({
                name: "see future",
                type: "action"
            });

            this.deck.push({
                name: "nope",
                type: "action"
            });

            this.deck.push({
                name: "draw bottom",
                type: "action"
            });

            this.deck.push({
                name: "favor",
                type: "action"
            });

            // image needed
            this.deck.push({
                name: "cat1",
                type: "cat"
            });

            // image needed
            this.deck.push({
                name: "cat2",
                type: "cat"
            });

            // image needed
            this.deck.push({
                name: "cat3",
                type: "cat"
            });

            // image needed
            this.deck.push({
                name: "cat4",
                type: "cat"
            });

            // image needed
            this.deck.push({
                name: "cat5",
                type: "cat"
            });
        }

        // Add an extra defuse to the deck
        this.deck.push({
            name: "defuse",
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

    // Returns false if invalid
    playCards(cards, playerName, targetCard) {
        // Action card logic

        if (cards.length === 1) {
            if (cards[0].type != "action") {
                return false;
            }

            switch(cards[0].name) {
                case "attack":
                    return true;
                case "favor":
                    return true;
                case "skip":
                    return true;
                case "shuffle":
                    this.shuffle();
                    return true;
                case "see future":
                    return true;
                case "nope":
                    return true; // Not always
                case "draw bottom":
                    this.drawFromBottom = true;
                    return true;
            }
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
            if (!this._hasDuplicates(cards)) {
                return true;
            }
            return false;
        }
        return false;
    }

    draw() {
        return this.deck.pop();
    }

    playDefuse(index) {
        this.deck.splice(index-1, 0, {
            name: "kitten",
            type: "bomb"
        })
        if (this.attackTurns > 0) {
            this.attackTurns -= 1;
            return 0;
        }
        this.turnCounter = (this.turnCounter + 1) % this.playerList.length;
        console.log(this.turnCounter);
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

        let card = this.draw();
        console.log(card.name);
        if (card.type === "bomb") {
            if (!player.hand.some(item => item.name === 'defuse')) {
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
        console.log(this.turnCounter);
    }
};