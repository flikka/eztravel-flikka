var express = require('express');
var passport = require('passport');
var http = require('http');
var SamlStrategy = require('passport-azure-ad').SamlStrategy;
var fs = require('fs');
var waad = require('node-waad');
var engine = require('ejs-locals');
var PATH = require('path');
var app = express();


var config = {
  // required options
  identityMetadata: 'https://login.windows.net/3aa4a235-b6e2-48d5-9195-7fcf05b459b0/federationmetadata/2007-06/federationmetadata.xml',
  loginCallback: 'https://eztravel-flikka-flikka.c9.io/login/callback/',
  issuer: 'https://eztravel-flikka-flikka.c9.io/'
};

// array to hold logged in users. State of the art.
var users = [];


var findByEmail = function(email, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.email === email) {
      return fn(null, user);
    }
  }
  return fn(null, null);
};

// Keep a reference to the saml Strategy as we will need it for an eventual logout
var samlStrategy = new SamlStrategy(config, function(profile, done) {
    if (!profile.email) {
      return done(new Error("No email found"), null);
    }
    // asynchronous verification, for effect. Wow!
    process.nextTick(function () {
      findByEmail(profile.email, function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          // "Auto-registration"
          users.push(profile);
          return done(null, profile);
        }
        return done(null, user);
      });
    });
  }
);


passport.use(samlStrategy);
app.engine('ejs', engine);

// configure Express
app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'vindbrest' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(PATH.join(__dirname, 'public')));
});

// To enzure authentication, put this on all request handlers
var ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    console.log("Is authenticated - number of users: " + users.length);
    return next();
  }
  res.redirect('/login');
};

app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});


app.get('/login',
  passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
  function(req, res) {
    res.redirect('/');
  }
);

app.post('/login/callback',
  passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
  function(req, res) {
    res.redirect('/');
  }
);

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
// //   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.email);
});

passport.deserializeUser(function(id, done) {
  findByEmail(id, function (err, user) {
    done(err, user);
  });
});


app.get('/travels/', ensureAuthenticated, function(req, res) {
    // User email resides in req.user.email, but -- whatever
    // if (req.user.email == "KFLIK@statoil.com") { 
        res.json(
            [
            {"travelid": 12,"location":"Bergen-Odda", "type":"Taxi", 
            "price":"2000", "start":"dødstidlig","slutt" : "lenge etterpå"},
            {"travelid": 2,"location":"Odda-Fjorden", "type":"Taxi", 
            "price":"23", "start":"seint","slutt" : "lenge etterpå"},
            {"travelid": 3,"location":"Fjorden-Odda", "type":"Taxi", 
            "price":"32", "start":"mørkt","slutt" : "lenge etterpå"},
            {"travelid": 4,"location":"Odda-Bergen", "type":"Taxi", 
            "price":"2010", "start":"natt","slutt" : "lenge etterpå"}
            ]
            );
    //}
    // else {
    //     res.send("Who are you really? I only know KFLIK@statoil.com, you are " +req.user.email);
    // }
});


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
