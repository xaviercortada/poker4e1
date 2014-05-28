/**
 * Created by xavier on 25/05/14.
 */

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID' 		: '299357863559956', // your App ID
        'clientSecret' 	: '4646f6bd9ea59749cc38aca6fa0b68e2', // your App Secret
        'callbackURL' 	: 'http://cardgame.net:3001/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey' 		: 'your-consumer-key-here',
        'consumerSecret' 	: 'your-client-secret-here',
        'callbackURL' 		: 'http://localhost:3001/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID' 		: 'your-secret-clientID-here',
        'clientSecret' 	: 'your-client-secret-here',
        'callbackURL' 	: 'http://localhost:3001/auth/google/callback'
    }

};

