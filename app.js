// app.js
require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const crypto = require('crypto');
const routes = require('./routes');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8090;


// Generate a secret key for session
const secretKey = crypto.randomBytes(32).toString('hex');
console.log(secretKey);
// image upload 
app.use(fileUpload());
app.use("/images", express.static('images'));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    session({
        secret: crypto.randomBytes(32).toString('hex'),
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);


app.use((req, res, next) => {
    const logEntry = `${new Date().toLocaleString()} | IP: ${req.ip} | Method: ${req.method} | Path: ${req.path}\n`;

    fs.appendFile("log.txt", logEntry, (err, data) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
        next();
    });
});

// Middleware setup
app.use(routes);

// Listen on port 8090
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});



