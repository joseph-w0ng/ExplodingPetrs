class Game {
    // players = clients
    constructor(players) {
        this.turnCounter = 0;
        this.playerList = []; // array of objects
        this.deck = []; 
        this.attackTurns = 0;
        this.shuffle();
        this.drawFromBottom = false;
        // initialize playerList and deal everyone a hand
        for (var i = 0; i < players.length; i++) {
            this.playerList.push({
                name: players[i].name,
                hand: []
            })
            this.playerList[i].hand.push({
                name: "defuse",
                type: "action"
            })
            // deal each player a hand of 5 cards (total)
            for (var j = 0; j < 4; j++) {
                this.playerList.push(this.deck.pop());
            }
        }
    }

    _hasDuplicates(array) {
        return (new Set(array)).size !== array.length;
    }

    _initializeDeck() {
        // push kittens, action, and cat cards
        for (var i = 0; i < playerList.length - 1; i++) {
            this.deck.push({
                name: "kitten",
                type: "bomb"
            });

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
                name: "cat1",
                type: "cat"
            });

            this.deck.push({
                name: "cat2",
                type: "cat"
            });

            this.deck.push({
                name: "cat3",
                type: "cat"
            });

            this.deck.push({
                name: "cat4",
                type: "cat"
            });

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
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
    }

    // Returns false if invalid
    playCards(cards, name, target) {
        // Action card logic

        if (cards.length === 1) {
            if (cards[0].type != "action") {
                return false;
            }

            switch(cards[0].name) {
                case "attack":
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

    endTurn() {
        // Defuse logic
    }
}

