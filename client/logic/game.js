class Game {
    constructor(players) {
        this.turnCounter = 0;
        this.playerList = []; // array of objects
        this.deck = []; 
        this.attackTurns = 0;
        this.shuffle();
        // initialize playerList and deal everyone a hand
        for (var i = 0; i < players.length; i++) {
            this.playerList.push({
                name: players[i],
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

    playCards(cards) {
        
    }

    endTurn() {
        // Defuse logic
    }
}