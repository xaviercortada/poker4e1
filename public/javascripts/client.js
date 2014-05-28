/**
 * Created by xavier on 10/05/14.
 */

var pack = undefined;
var currentPlayer = undefined;
var playersRoom = {};
var playersCount = 0;
var socket = undefined;
var countDownId = undefined;


window.onload = function(){

    var ready = true;

    socket = io.connect('http://cardgame.net:3001');

    socket.on('welcome', function(object){
       currentPlayer = new Player(object);
        playersRoom[currentPlayer.id] = currentPlayer;
       $("#username p")[0].innerText = currentPlayer.username;
        $("#controll").empty();
        $("#controll").append(startBtn());

    });

    socket.on('not_ready', function(data){
        $("#messagesDiv p")[0].innerText = 'Hay una partida en marcha, espere y vuelva a intentar';
        $("#controll").empty();
        $("#controll").append(startBtn());
    })

    socket.on('ready', function(data){
        $("#messagesDiv p")[0].innerText = 'Se esta preparando una partida, quiere jugar?';
        $("#controll").empty();
        $("#controll").append(startBtn());
    })

    socket.on('start_countdown', function(data){
        $("#messagesDiv p")[0].innerText = 'Segundos para empezar: '+data.timeLeft;
    });

    socket.on('discard_countdown', function(data){
        $("#messagesDiv p")[0].innerText = 'Segundos para descartar: '+data.timeLeft;
    });

    socket.on('join', function(object){
        playersCount = 0;
        for(var i in object){
            var player = new Player(object[i]);
            playersRoom[player.id] = player;
            playersCount++;
            updatePlayersRoom(player);
        }
    });

    socket.on('failToStart', function(data){
        $("#messagesDiv p")[0].innerText = 'No se ha podido iniciar la partida';

        $("#controll").empty();
        $("#controll").append(startBtn());

        currentPlayer.room = undefined;
        playersCount = 0;
        playersRoom = {};
        resetDiscard();
    });

    socket.on('start', function(data){
        $("#messagesDiv p")[0].innerText = 'Empieza la partida';
    });

    socket.on("firstDeal", function(object){
        var hand = Player.unserializeHand(object.hand);
        var id = object.id;
        playersRoom[id].setHand(hand);
        resetDiscard();
        showCards(id, hand, true);
        if(currentPlayer.id == id) {
            $("#messagesDiv p")[0].innerText = 'Escoja las cartas para el descarte';
            $("#controll").empty();
            $("#controll").append(discardBtn());
        }
    });

    socket.on("secondDeal", function(object){
        var hand = Player.unserializeHand(object.hand);
        var id = object.id;
        playersRoom[id].setHand(hand);
        $("#controll").empty();
        showCards(id, hand, false);
        $("#messagesDiv p")[0].innerText = 'Jugada completada';

        setTimeout(function(){
            $("#controll").empty();
            $("#controll").append(startBtn());
        }, 20000);
    });

    socket.on("discard", function(){
        socket.emit('player_discard', Player.serializeHand(playersRoom[currentPlayer.id].hand));
        $("#controll").empty();
    });

    socket.on("showdown", function(players){
       for(var key in players){
           var player = players[key];
           if(player.hasWon){
               $("tr[id="+player.id+"]").toggleClass("winner");

               var handRank = JSON.parse(player.handRank);
               $("#room_messages p")[0].innerText = player.username+' ha ganado con '+handRank.handName;
               $("#room_messages").show();

           }
       }
    });
};


var showCards = function(id, hand, isFirstDeal){
    $("tr[id="+id+"] td").remove(".hand");

    for(var key in hand){
        var card = hand[key];
        var ele = cardImg(card.rank, card.suit);
        if(id != currentPlayer.id && isFirstDeal){
            ele = reverseImg();
        }
        var td = cardTd();
        td.html(ele);

        $("tr[id="+id+"]").append(td);
    }
    if(id == currentPlayer.id && isFirstDeal){
        var discardBlock = discardTr();
        $("tr[id="+id+"]").parent().append(discardBlock);
        $(":checkbox").click(function(){
            countChecked(this);
        });


    }
}


var countDown = function(){
    countDownId = setInterval(function(){
        socket.emit('countdown',{});

    }, 1000);
}


var deal = function(){
    socket.on("deal", function(object){
        if (ready) {
            showCards(object)
        }
    });
};

var clearRoom = function(){
    $("#room_messages").hide();

    $(".player").removeAttr("id");
    $(".player").html("player");
}

var updatePlayersRoom = function(player){
    if(currentPlayer.id == player.id){
        $("#currentPlayer tbody").empty();

        var ele = playerTr(player.id);
        $("#currentPlayer tbody").append(ele);
        ele.append(playerTd(player.username));
        $("#controll").empty();
    }else{
        $("tr[id="+player.id+"]").remove();
        var ele = playerTr(player.id);
        $("#room tbody").append(ele);
        ele.append(playerTd(player.username));
    }
};

var updatePlayersRoom2 = function(player){
    if($(".player[id="+player.id+"]").length > 0) return;

    if(currentPlayer.id == player.id){
        currentPlayer.room = player.room;
        var ele = $("#currentPlayer .player").eq(0);
        ele.parent().attr("id", player.id);
        ele.html(player.username);
        $("#controll").empty();
    }else{
      var ele = $("#room .player:not([id])").eq(0);
        ele.attr("id", player.id+'b');
        ele.parent().attr("id", player.id);
        ele.html(player.username);
    }
    //$(".player").eq(iCell).attr("id", data.id);
    //$(".player").eq(iCell)[0].innerText = data.username;
};


var updateHand = function(data){
    for(var i = 0; i < data.length; i++){
        var card = new Card(JSON.parse(data[i]));
        $("#hand tbody tr td")[i].innerText = card.toString();

    }

};

var countChecked = function(object){
  var nCount = $("input:checked").length;
    if(nCount > 4){
        alert("Solo puede descartar 4 cartas");
        object.checked = false;
    }else{
        playersRoom[currentPlayer.id].hand[$(":checkbox").index(object)].discarded = true;
    }
};

var removeBtn = function(btnId){
    if($(btnId).length){
        $(btnId).remove();
    }
}

var startBtn = function(){
    return  $("<button/>",{
        id : 'startBtn',
        text : 'start',
        class : 'btn-lg btn-success',
        click : function(){
            clearRoom();
            socket.emit('start', currentPlayer);
            $("#controll").empty();
        }
    });
}

var discardBtn = function(){
    return $("<button/>",{
        id : 'discardBtn',
        text : 'descarte',
        class : 'btn-lg btn-success',
        click : function(){
            socket.emit('player_discard', Player.serializeHand(playersRoom[currentPlayer.id].hand));
            $("#controll").empty();
        }
    });
}

var cardImg = function(index, suit){
  return $("<img/>",{
        src : '/img/'+Card.pathIndex[index]+'_of_'+Card.pathSuit[suit]+'.png',
      width : '65px',
      height : '100px'
  });
};

var reverseImg = function(){
    return $("<img/>",{
        src : '/img/reverse_blue_large.png',
        width : '65px',
        height : '100px'
    });
};

var playerTr = function(id){
    return $("<tr/>",{
       id : id
    });
}

var playerTd = function(username){
    return $("<td/>",{
        class : 'player',
        text : username
    });
}

var cardTd = function(){
    return $("<td/>",{
        class : 'hand'
    });
}

var discardTr = function(){
    var eleTr = $("<tr/>");

    eleTr.append($("<td/>"));
    for(var i = 0; i < 5; i++){
        eleTr.append(discardInput());
    }
    return eleTr;
}

var discardInput = function(){
    var eleTd = $("<td/>",{
        class : 'discard',
        text : 'discard'
    });
    eleTd.append( $("<input/>",{
       type : 'checkbox',
       text : 'discard',
       value : 'discard'
    }));
    return eleTd;
}

var resetDiscard = function(){
    $(":checkbox").removeAttr("checked");
}
