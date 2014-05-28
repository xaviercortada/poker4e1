//   server.js

// BASE SETUP
// ==============================================

var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app     = express();
var port    = process.env.PORT || 3001;
var pub = __dirname;

var path = require('path');

var routes = require('./routes/index');
var users = require('./routes/routes');


var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(3001);

app.engine('jade', require('jade').__express);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use('/', routes);
app.use('/users', users);


// START THE SERVER
// ==============================================
//app.listen(port);
console.log('Magic happens on port ' + port);

server.listen(3001);

io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});
