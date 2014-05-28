
module.exports = function(app, passport) {

    /* GET all. */
    app.use(function (req, res, next) {
        console.log('.......route: %s %s %s', req.method, req.url, req.path);
        next();
    });

    /* GET home page. */
    app.get('/', function (req, res) {
        res.render('index', { title: 'Card Game' });
    });

    /* GET login page. */
    app.get('/login', function (req, res) {
        res.render('login',  { message: req.flash('loginMessage') });
    });

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/game', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    /* GET users listing. */
    app.get('/signup', function (req, res) {
        res.render('signup', { message: req.flash('signupMessage') });
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/game', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    /* GET users listing. */
    app.get('/game', isLoggedIn, function (req, res) {
        res.render('game', { title: 'Card Game' });
    });

    /* GET logout. */
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook',
        {
        scope : ['email','publish_actions']
    }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/game',
            failureRedirect : '/'
        }));

};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    console.log('loggedin: '+req.sessionID);
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
