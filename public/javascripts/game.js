/**
 * Created by xavier on 10/05/14.
 */

var PokerEvaluator = require("poker-evaluator");
var playerlib = require("./player");
var User = require('../../models/user');
var FB = require('fb');


var myIo;

var suits = new Array(
    "h",
    "d",
    "s",
    "c"
);

var rank = {
    1: 'A',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9',
    10: 'T',
    11: 'J',
    12: 'Q',
    13: 'K'
}

var Pack = function () {
    this.cards = new Array();
}

var n = 52;

var index = 52 / suits.length;


Pack.prototype.initialize = function () {
    var count = 0;
    for (i = 0; i <= 3; i++) {
        for (j = 1; j <= index; j++) {
            var card = new playerlib.Card({suit: suits[i], rank: rank[j]});
            this.cards[count++] = card;
        }
    }
};


Pack.prototype.shuffle = function () {
    var i = this.cards.length;
    var j, tempi, tempj;

    while (--i) {
        j = Math.floor(Math.random() * (i + 1));
        tempi = this.cards[i];
        tempj = this.cards[j];

        this.cards[i] = tempj;
        this.cards[j] = tempi;

    }
};

Pack.prototype.toString = function () {
    var s = '';
    for (var key in this.cards) {
        s += ',' + this.cards[key].toString();
    }
    return s;
};

Pack.prototype.deal = function (n) {
    if (this.cards.length >= n) {
        return this.cards.splice(0, n);
    }

    return {};
};

var maxplayers = 5;

var CardGame = function () {
    this.players = [];
    this.count = 0;
    this.nDiscarded = 0;
    this.pack = new Pack();
    this.state = undefined;
    this.room = undefined;
};

CardGame.setIO = function (io) {
    myIo = io;
};

CardGame.states = {
    INITIALIZED: 0,
    WAITING: 1,
    FIRST_DEAL: 2,
    DISCARD: 3,
    SECOND_DEAL: 4,
    END: 5,
    READY: 6
};

CardGame.prototype.initialize = function () {
    this.pack.initialize();
    this.state = CardGame.states.INITIALIZED;
}

CardGame.prototype.createRoom = function (uuid) {
    this.room = uuid;
}

CardGame.prototype.shuffle = function () {
    this.pack.shuffle();
};

CardGame.prototype.join = function (obj) {
    var current = new playerlib.Player(obj);
    for (var key in this.players) {
        var player = this.players[key];
        if (player.username == current.username) {
            if (player.id == current.id) {
                delete this.players[key];
                this.players[current.id] = current;
            }
            return;
        }
    }
    if (this.count < maxplayers) {
        this.players[current.id] = current;
        this.count++;
        if (this.count == 1) {
            this.waitForPlayers();
        }
    }
};

CardGame.prototype.leave = function (socketId) {
    for (var key in this.players) {
        var player = this.players[key];
        if (player.id == socketId) {
            delete this.players[key];
            this.count--;
            break;
        }
    }
};

CardGame.prototype.playerDiscarded = function (socketId, hand) {
    this.nDiscarded++;

    this.players[socketId].discarded(hand);

    if (this.count == this.nDiscarded) {
        clearInterval(gameLoop);
        this.secondDeal();
    }
}

var gameLoop = 0;
var deltaTime = 0;
var start_limitTime = 20;
var discard_limitTime = 60;
var timeLeft = 0;

CardGame.prototype.waitForPlayers = function () {
    if (this.state == CardGame.states.WAITING) {
        return;
    }

    this.state = CardGame.states.WAITING;
    timeLeft = start_limitTime;
    deltaTime = new Date();
    var game = this;
    gameLoop = setInterval(function () {
        game.tryToStart();
    }, 1000);

};

CardGame.prototype.playersToJSON = function () {
    var object = [];
    var i = 0;
    for (var key in this.players) {
        var item = this.players[key];
        object[i++] = playerlib.Player.toJSON(item);
    }

    return object;

}


CardGame.prototype.tryToStart = function () {
    var t = new Date();
    var seconds = (t - deltaTime) / 1000;
    timeLeft = start_limitTime - seconds;
    myIo.sockets.in(this.room).emit('start_countdown', {timeLeft: Math.round(timeLeft)});
    if (timeLeft < 0) {
        clearInterval(gameLoop);
        this.canStart();
    }
};

CardGame.prototype.canStart = function () {
    if (this.count > 1) {
        this.start();
    } else {
        this.failToStart();
    }
};

CardGame.prototype.start = function () {
    this.state = CardGame.states.READY;
    myIo.sockets.in(this.room).emit('start', {});
    this.state = CardGame.states.FIRST_DEAL;
    this.firstDeal();
};

CardGame.prototype.firstDeal = function () {
    for (var key in this.players) {
        var player = this.players[key];
        var hand = this.deal(5);
        player.setHand(hand);
        myIo.sockets.in(this.room).emit('firstDeal', {
            id: player.id,
            hand: playerlib.Player.serializeHand(hand)});
    }
    this.waitForDiscard();
}

CardGame.prototype.secondDeal = function () {
    for (var key in this.players) {
        var player = this.players[key];
        for (var index in player.hand) {
            var card = player.hand[index];
            if (card.discarded) {
                player.hand[index] = this.pack.deal(1)[0];
            }
        }
        myIo.sockets.in(this.room).emit('secondDeal', {
            id: player.id,
            hand: playerlib.Player.serializeHand(player.hand)
        });
    }
    // Analizar resultado
    // this.waitForResult();
    this.evalHands();
    setTimeout(this.showdown(), 10000);
}

CardGame.prototype.showdown = function () {
    myIo.sockets.in(this.room).emit('showdown', this.playersToJSON());
    setTimeout(this.reset(), 10000);
}

CardGame.prototype.waitForDiscard = function () {
    this.state = CardGame.states.DISCARD;
    this.nDiscarded = 0;
    timeLeft = discard_limitTime;
    deltaTime = new Date();
    var game = this;
    gameLoop = setInterval(function () {
        game.checkDiscardComplete();
    }, 1000);
}

CardGame.prototype.checkDiscardComplete = function () {
    var t = new Date();
    var seconds = (t - deltaTime) / 1000;
    timeLeft = discard_limitTime - seconds;
    myIo.sockets.in(this.room).emit('discard_countdown', {timeLeft: Math.round(timeLeft)});
    if (timeLeft < 0) {
        clearInterval(gameLoop);
        this.forceDiscard();
    }
};

CardGame.prototype.forceDiscard = function () {

    for (var key in this.players) {
        var player = this.players[key];
        if (!player.isDicarded) {
            myIo.sockets.socket(player.id).emit('discard');
        }
    }


    this.state = CardGame.states.SECOND_DEAL;

    //setTimeout(this.secondDeal(), 30000);
}


CardGame.prototype.failToStart = function () {
    myIo.sockets.in(this.room).emit('failToStart', {});
    this.reset();
};

CardGame.prototype.deal = function (i) {
    var hand = this.pack.deal(i);
    return hand;
};

CardGame.prototype.evalHands = function () {
    var winner = undefined;
    for (var key in this.players) {
        var player = this.players[key];
        player.hasWon = false;
        player.handRank = this.evalHand(player.handToArray());
        this.saveHand(player);
        if (winner == undefined) {
            winner = player;
        } else {
            if (player.handRank.handType > winner.handRank.handType) {
                winner = player;
            } else {
                if (player.handRank.handType == winner.handRank.handType
                    && player.handRank.handRank > winner.handRank.handRank) {

                    winner = player;

                }
            }
        }
    }

    winner.hasWon = true;
    //this.feed(winner, winner.username+' ha guanyat la partida amb '+winner.handRank.handName);

}

CardGame.prototype.evalHand = function (hand) {
    return PokerEvaluator.evalHand(hand);
}

CardGame.prototype.saveHand = function(player){
    User.findOne({ 'local.username' :  player.username }, function(err, user) {
        if (err) {
            throw err;
        }

        if (user) {
            if(user.local.rank == undefined) user.local.rank = 0;

            user.local.rank += player.handRank.value;
            user.local.lastHand = Date.now();
            user.save();
        }
    });
}

CardGame.prototype.feed = function(player, message){
    FB.setAccessToken(player.facebook.token);

    FB.api(
        //"/me/scores",
            "/"+player.facebook.id+"/feed",
        "POST",
        {

            "message": message

        },
        function (response) {
            if (response && response.error != undefined) {
                console.log(response.error.message);
            }
        }
    );

}

CardGame.prototype.reset = function () {
    this.initialize();
    this.shuffle();
    this.players = [];
    this.count = 0;
    this.nDiscarded = 0;
    this.room = undefined;
    myIo.sockets.emit('ready', {});
}

//exports.Card = Card;
//exports.Pack = Pack;
//exports.Player = Player;
module.exports = CardGame;

