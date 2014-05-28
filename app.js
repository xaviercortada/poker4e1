var express = require('express.io');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var xtend = require('xtend');
var uuid = require('node-uuid');
var stylus = require('stylus');
var nib = require('nib');
var FB = require('fb');

//Client to connect mogodb
var mongoose = require('mongoose');

//libraries required for authentication
var passport = require('passport');
var passportSocketIo = require('passport.socketio');
var session = require('express-session');
var flash = require('connect-flash');

var app = express()

function compile(str, path) {
    return stylus(str)
        .set('filename', path)
        .use(nib())
}

var port =  process.env.Port || 3001;

admin
RK5Z8ughZxB4
database: nodejs
url:  mongodb://$OPENSHIFT_MONGODB_DB_HOST:$OPENSHIFT_MONGODB_DB_PORT/

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var configDB = require('./config/database.js');
mongoose.connect(configDB.url);

var SessionStore = require("connect-mongo")(session);
var store = new SessionStore({
    url: "mongodb://localhost/session",
    interval: 120000 // expiration check worker run interval in millisec (default: 60000)
});


function onAuthorizeSuccess(data, accept){
    console.log('successful connection to socket.io');

    // The accept-callback still allows us to decide whether to
    // accept the connection or not.
    accept(null, true);
};

function onAuthorizeFail(data, message, error, accept){
    if(error)
        throw new Error(message);
    console.log('failed connection to socket.io:', message);

    // We use this callback to log all of our failed connections.
    accept(null, false);
};


require('./config/passport')(passport); // pass passport for configuration

//Configure the middleware
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser());
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded());


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// stylus engine setup
app.use(express.logger('dev'))
app.use(stylus.middleware(
    {  src: __dirname + '/public',
       compile: compile
    }
))

//app.use(express.static(__dirname + '/public'))

var secret = 'enunlugardelamanchadecuyonombre';

app.use(cookieParser(secret));

//Configure passport
var sessionOptions = {
    key: 'cardgame.sid',
    cookie: { maxAge: 9000 },
    secret: secret, // session secret
    store: store
};

app.use(session(
    sessionOptions
));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

app.use(express.static(path.join(__dirname, 'public')));
//app.use('scripts',express.static(path.join(__dirname, 'scripts')));

require('./routes/routes.js')(app, passport);

server.listen(port);

module.exports = app;

var CardGame = require('./public/javascripts/game');
var playerlib = require('./public/javascripts/player');

var cardgame = new CardGame();

CardGame.setIO(io);

cardgame.initialize();

cardgame.shuffle();


// set authorization for socket.io
io.set('authorization', passportSocketIo.authorize(xtend(sessionOptions,
    {passport : passport,
     cookieParser: express.cookieParser})));

io.set('log level',1);

FB.api('4', function (res) {
    if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
    }
    console.log(res.id);
    console.log(res.name);
});

io.sockets.on('connection', function (socket) {
    var sessionID = socket.handshake.sessionID;
    var username = socket.handshake.user._doc.local.username;

    if(username == undefined){
        username = socket.handshake.user._doc.facebook.name;
        //FB.setAccessToken('299357863559956|NVHU4_CNurx5qE_HKgceUc3n0Sw');
        FB.setAccessToken(socket.handshake.user._doc.facebook.token);

        FB.api(
            //"/me/scores",
                "/"+socket.handshake.user._doc.facebook.id+"/scores",
            "POST",
            {

                "score": "6101"

            },
            function (response) {
                if (response && response.error != undefined) {
                    console.log(response.error.message);
                }
            }
        );
    }

    //console.log("sessionId: "+socket.handshake.cookie['cardgame.sid']);
    console.log('username: '+username);
    console.log('sessionID: '+sessionID);

    var player = new playerlib.Player({username :username,
        id : socket.id,
        facebook : socket.handshake.user._doc.facebook});

    socket.emit('welcome', playerlib.Player.toJSON(player));

    //var hand = cardgame.deal(5);
    //player.setHand(hand);
    //socket.emit('deal', cardgame.serializeHand(hand) );

    socket.on('start', function(data){
        if(cardgame.state == CardGame.states.INITIALIZED ||
            cardgame.state == CardGame.states.WAITING){

            if(cardgame.room == undefined){
                cardgame.createRoom(uuid.v4());
            }
            data.room = cardgame.room;
            socket.join(cardgame.room);
            cardgame.join(data);
            //socket.emit('join', data);
            io.sockets.in(cardgame.room).emit('join', cardgame.playersToJSON());

        }else{
            socket.emit('not_ready', {});
        }
    });

    socket.on('disconnect', function(){
       cardgame.leave(socket.id);
        if(cardgame.room != undefined){
            socket.leave(cardgame.room);
        }
    });

    socket.on('player_discard', function(data){
       var hand = playerlib.Player.unserializeHand(data);
       cardgame.playerDiscarded(socket.id, hand);
    });



});