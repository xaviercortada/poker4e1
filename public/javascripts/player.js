/**
 * Created by xavier on 24/05/14.
 */


(function(exports){

    var Card = function(obj){
        this.suit = undefined;
        this.rank = undefined;
        this.discarded = false;

        for (var prop in obj) this[prop] = obj[prop];
    };

    Card.pathSuit = {
        'h' : 'hearts',
        's' : 'spades',
        'c' : 'clubs',
        'd' : 'diamonds'
    }

    Card.pathIndex = {
        A : 'ace',
        2 : '2',
        3 : '3',
        4 : '4',
        5 : '5',
        6 : '6',
        7 : '7',
        8 : '8',
        9 : '9',
        T : '10',
        J : 'jack',
        Q : 'queen',
        K : 'king'
    }



    Card.prototype.toString = function(){
        return this.rank+':'+this.suit;
    };

    var Player = function(obj){
        this.username = undefined;
        this.hand = [];
        this.id = undefined;
        this.room = undefined;
        this.isDicarded = false;
        this.handRank = undefined;
        this.hasWon = false;
        this.facebook = undefined;
        for (var prop in obj) this[prop] = obj[prop];

        if(obj.facebook != undefined && obj.facebook.id == undefined){
            this.facebook = JSON.parse(obj.facebook);
        }else{
            this.facebook = obj.facebook;
        }

    };

    Player.prototype.handToArray = function(){
        var object = [];
        for(var i in this.hand){
            var card = this.hand[i];
            object[i] = card.rank+card.suit;
        }
        return object;
    }

    Player.serializeHand = function(hand){
        var object = {};
        for(var i in hand){
            var card = hand[i];
            object[i] = JSON.stringify(card);
        }

        return object;
    };

    Player.unserializeHand = function(object){
        var hand = {};
        for(var i in object){
            var card = new Card(JSON.parse(object[i]));
            hand[i] = card;
        }
        return hand;
    };

    Player.prototype.setHand = function(cards){
        this.hand = cards;
    };

    Player.prototype.discarded = function(data){
        for(var key in data){
            var card = this.hand[key];
            card.discarded = data[key].discarded;
        }
    };

    Player.toJSON = function(player){
        var object = {
            username : player.username,
            id : player.id,
            room : player.room,
            facebook : JSON.stringify(player.facebook),
            handRank : JSON.stringify(player.handRank),
            hasWon : player.hasWon,
            hand : {}
        };

        object.hand = Player.serializeHand(player.hand);

        return object;
    };


    Player.parseJSON = function(data){
        var player = new Player(data);
        player.hand = Player.unserializeHand(data.hand);
        player.facebook = JSON.parse(data.facebook);
        return player;
    };

    exports.Card = Card;
    exports.Player = Player;

})( typeof global === "undefined" ? window : exports);