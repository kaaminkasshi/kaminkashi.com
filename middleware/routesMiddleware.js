// middleware/routesMiddleware.js

const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const { delay } = require('./middlewareFunctions');

const app = express();

// Generate a secret key for session
const secretKey = crypto.randomBytes(32).toString('hex');
console.log(secretKey);
app.use(express.static('public'));
app.use(
    session({
        secret: secretKey,  // Use the same secret key generated above
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);

module.exports = {
    app,
};
