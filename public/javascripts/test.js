/**
 * Created by xavier on 14/05/14.
 */


var passportSocketIo = require('passport.socketio');

// set authorization for socket.io
io.set('authorization', passportSocketIo.authorize({
    cookieParser: cookieParser,
//    key:         'express.sid',       // the name of the cookie where express/connect stores its session_id
    secret:      'enunlugardelamanchadecuyonombre',    // the session_secret to parse the cookie
    store:       store                // we NEED to use a sessionstore. no memorystore please
//    success:     onAuthorizeSuccess,  // *optional* callback on success - read more below
//    fail:        onAuthorizeFail     // *optional* callback on fail/error - read more below
}));



io.set('authorization', function (handshakeData, accept) {

    if (handshakeData.headers.cookie) {

        handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);

        handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['cardgame.sid'], 'enunlugardelamanchadecuyonombre');

        if (handshakeData.cookie['cardgame.sid'] == handshakeData.sessionID) {
            return accept('Cookie is invalid.', false);
        }

    } else {
        return accept('No cookie transmitted.', false);
    }

    accept(null, true);
});


cookieParser: cookieParser,
    key:         'cardgame.sid',       // the name of the cookie where express/connect stores its session_id
    secret:      'enunlugardelamanchadecuyonombre',    // the session_secret to parse the cookie
    store:       store,                // we NEED to use a sessionstore. no memorystore please
    success:     onAuthorizeSuccess,  // *optional* callback on success - read more below
    fail:        onAuthorizeFail     // *optional* callback on fail/error - read more below
}));


