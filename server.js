require('dotenv').config()
const express = require('express'),
  app = express(),
  server = require('http').Server(app),
  router = express.Router(),
  bodyParser = require('body-parser'),
  ejwt = require('express-jwt'),
  passport = require('./app/lib/passport'),
  cors = require('cors'),
  port = process.env.PORT || 8000,
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  session = require('express-session'),
  jsonwebtoken = require('jsonwebtoken'),
  cron = require('node-cron'),
  { clearNominationQueue } = require('./app/lib/cron'),
  timeout = require('connect-timeout');

app.use(timeout(480000));
app.use(haltOnTimedout);

function haltOnTimedout(req, res, next) {
  if (!req.timedout) next();
}
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-For'],
  credentials: true
}))

app.use(bodyParser.urlencoded({
  limit: '500mb',
  extended: true,
  type: 'application/x-www-form-urlencoded'
}))

app.use(bodyParser.json({
  limit: '500mb',
  type: 'application/*'
}))

app.use(ejwt({
  secret: process.env.JWT_SECRET_KEY || 'supersecret'
}).unless({
  path: [
    {
      url: /\/auth*/,
    }
  ]
}))

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'bla bla bla'
}));

app.use(passport.initialize())
app.use(passport.session());

app.get('/auth/twitter',
  passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function (req, res) {
    let token = jsonwebtoken.sign({
      id: req.user.user_id,
      twitter_id: req.user.id,
      username: req.user.username,
      name: req.user.displayName,
      avatar: req.user.photos[0].value && req.user.photos[0].value.replace('normal', '400x400'),
      banner: req.user.profile_banner_url,
      near_connected: req.user.near_connected,
      near_account_id: req.user.near_account_id,
      type: req.user.type,
    },
      process.env.JWT_SECRET_KEY,
    )
    // Successful authentication, redirect home.
    res.redirect(`${process.env.CLIENT_URL}/auth/redirect?token=${token}`);
  });

app.use(function (req, res, next) {

  if (req.query.related) {
    req.query.related = `[${req.query.related}]`
  }

  next()
})

function parseQueryString(req, res, next) {
  if (req.query && req.query.hasOwnProperty('filter')) {
    req.query.filter = _.mapValues(req.query.filter, function (value, key) {
      if (value === 'false')
        return false
      else if (value === 'true')
        return true
      else
        return value
    });
  }
  if (req.query && req.query.hasOwnProperty('filterRelated')) {
    req.query.filterRelated = _.mapValues(req.query.filterRelated, function (value, key) {
      if (value === 'false')
        return false
      else if (value === 'true')
        return true
      else
        return value
    });
  }
  next()
}

fs.readdirSync('./app/routes').forEach((file) => {
  router.use(`/${path.parse(file).name}`, parseQueryString, require(`./app/routes/${file}`)(
    express.Router()
  ))
})
app.get('/', (req, res) => res.send('OK'))
app.use(router)

cron.schedule('0 0 1 * *', () => {
  //this runs on first of each month
  clearNominationQueue()
});


// const throng = require('throng')

// const WORKERS = process.env.WEB_CONCURRENCY || 1

// throng(start)

// function start() {
//   server.listen(port, () => {
//     console.log(`Server active at http://localhost:${port} on ID: ${process.pid}`)
//   })
// }
// if (process.env.NODE_ENV == 'development' || process.env.NODE_ENV === undefined) {
server.listen(port, () => {
  console.log(`Server active at http://localhost:${port} on ID: ${process.pid}`)
})

// } 
// else {
//   exports.server = server
// }
