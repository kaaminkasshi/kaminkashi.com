
// routes/index.js

const express = require('express');
const { delay } = require('../middleware/middlewareFunctions');
const { loadCommentsFromFile,
    loadUserDataFromFile,
    writeCommentsToFile,
    writeUserDataToFile,
    loadBirthDataFromFile,
    loadDeceasedDataFromFile,
    writeDeceasedDataToFile,
    writeBirthDataToFile
} = require('../models/userModel');

const router = express.Router();
const fs = require('fs');
const nodemailer = require('nodemailer');

// Load existing users and verification codes
const users = require('../Users.json');  // Use the correct relative path
const verificationCodes = require('../verificationCode.json');

// Function to send verification code via email
function sendVerificationEmail(email, verificationCode) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.G_ID,  // Provide a valid email address
            pass: process.env.G_PASS // Add your Gmail password
        },
    });

    const mailOptions = {
        from: process.env.G_ID,
        to: email,
        subject: 'Email Verification Code',
        text: `Your email verification code is: ${verificationCode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
        } else {
            console.log(`Email sent: ${info.response}`);
        }
    });
}

function authenticateUser(req, res, next) {
    const user = req.session.user;

    if (!user) {
        // Redirect to login page or send an error response
        return res.status(401).render('login', { error: 'Unauthorized access. Please log in.' });
    }

    // User is authenticated, proceed to the next middleware or route handler
    next();
}
// Function to get matching users based on date of birth
function getMatchingUsersBasedOnDOB(searchDob, users) {
    const formattedSearchDob = formatDate(searchDob);

    // Extract month and day from the search date
    const searchMonthDay = formattedSearchDob.substring(5);

    // Matching users for exact date match
    const exactDateMatchUsers = users.filter((user) => {
        return user.dob === formattedSearchDob;
    });

    // Matching users for month and day match
    const monthDayMatchUsers = users.filter((user) => {
        const userMonthDay = user.dob ? user.dob.substring(5) : null;
        return userMonthDay === searchMonthDay && user.dob !== formattedSearchDob;
    });

    // Combine both sets of matching users
    const matchingUsers = [...exactDateMatchUsers, ...monthDayMatchUsers];

    return matchingUsers.map(user => ({
        id: user.id,
        firstName: user.firstName,
        dob: user.dob,
        description: user.description,
        image: user.image,
        color: matchingUsers.length > 1 ? 'green' : 'normal',
    }));
}

//< update 11jan2023
function getMatchingUsersBasedOnDeceased(searchDeceased, d_users) {
    const formattedSearchDeceased = formatDate(searchDeceased);

    // Extract month and day from the search date
    const searchMonthDDay = formattedSearchDeceased.substring(5);

    // Matching users for exact date match
    const exactDDateMatchUsers = d_users.filter((d_user) => {
        return d_user.Deceased === formattedSearchDeceased;
    });

    // Matching users for month and day match
    const monthDDayMatchUsers = d_users.filter((d_user) => {
        const userMonthDDay = d_user.Deceased ? d_user.Deceased.substring(5) : null;
        return userMonthDDay === searchMonthDDay && d_user.Deceased !== formattedSearchDeceased;
    });

    // Combine both sets of matching users
    const matchingDUsers = [...exactDDateMatchUsers, ...monthDDayMatchUsers];

    return matchingDUsers.map((d_user) => ({
        id: d_user.id,
        firstName: d_user.firstName,
        Deceased: d_user.Deceased,
        description: d_user.description,
        image: d_user.image,
        color: matchingDUsers.length > 1 ? 'green' : 'normal',
    }));
}

//> updates


// Function to format date
function formatDate(dateString) {
    try {
        const formattedDate = new Date(dateString);
        if (isNaN(formattedDate.getTime())) {
            throw new Error('Invalid date');
        }
        return formattedDate.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date:', error.message);
        return null;
    }
}

// Function to find a user by email
function findUserByEmail(email, users) {
    // Check if users is defined before using find
    if (users) {
        return users.find((user) => user.email === email);
    } else {
        // Handle the case where users is undefined
        console.error('Error: Users array is not defined');
        return null;
    }
}


// Function to find a user by email and password
function findUser(email, password, users) {
    // Check if users is defined before using find
    if (users) {
        return users.find((user) => user.email === email && user.password === password);
    } else {
        // Handle the case where users is undefined
        console.error('Error: Users array is not defined');
        return null;
    }
}

// ... (other functions related to routes)

// Home route
router.get('/', async (req, res) => {
    await delay(1000);

    return res.render('index');
});

router.get('/signup', (req, res) => {

    return res.render('signup');
});

//< updates 12jan2024 
// router.post('/signup', async (req, res) => {
router.post('/signup', async (req, res) => {
    await delay(1000);
    const { firstName, lastName, email, password, gender, dob } = req.body;

    // Generate a 4-digit verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000);

    // Save user details and verification code
    //userss.push({ email, password });
    verificationCodes[email] = verificationCode;

    // Send verification code via email
    sendVerificationEmail(email, verificationCode);

    res.render('emailVerify', { email });

    // Load or initialize the users array
    const users = loadUserDataFromFile();
    if (!users) {
        console.error('Error loading users array.');
        return res.render('signup', { error: 'Error loading user data' });
    }

    // Check if any field is missing
    if (!firstName || !lastName || !email || !password || !gender || !dob) {
        return res.render('signup', { error: 'Please fill in all fields' });
    }

    // Check if the request includes a file (image)
    const imageFile = req.files && req.files.image;

    // Check if the user already exists
    const findUserByEmail = users.find(user => user.email === email);
    if (findUserByEmail) {
        return res.render('signup', { error: 'User with this email already exists' });
    }


    // Add the new user to the array with image information
    const newUser = {
        id: users.length + 1,
        firstName,
        lastName,
        email,
        password,
        gender,
        dob,
        image: imageFile ? `/uploads/${imageFile.name}` : null, // Save the image file path if provided
        signupTimestamp: new Date().toISOString(), // Add signup timestamp
    };

    // Add the new user to the array
    users.push(newUser);

    // Save the updated user array to the JSON file
    writeUserDataToFile(users);

    // If an image is provided, save it to the 'uploads' directory
    if (imageFile) {
        imageFile.mv(`public/uploads/${imageFile.name}`, (err) => {
            if (err) {
                console.error('Error saving image:', err);
            }
        });
    }


    // Redirect to the verification page after successful registration
    // res.redirect('/verification');   //< updates 14jan2024
});

// Email verification route
router.post('/verify', (req, res) => {
    const { email, verificationCode } = req.body;

    if (verificationCodes[email] && verificationCodes[email] == verificationCode) {
        return res.render('verification', { email });
    } else {
        res.send('Invalid verification code. Please try again.');
    }
});


router.get('/login', (req, res) => {

    return res.render('login', { error: null });
});


router.post('/login', (req, res) => {

    const { email, password } = req.body;

    // Load or initialize the users array
    const users = loadUserDataFromFile();

    // Check if user credentials are valid
    const user = findUser(email, password, users);

    if (user) {
        // Set the user in the session
        req.session.user = user;
        console.log('User in session:', req.session.user);

        // Redirect to the home page or user dashboard after successful login
        return res.redirect('/home');
    } else {
        // Render the login page with an error message
        res.render('login', { error: 'Invalid email or password' });
    }
});

router.get('/home', async (req, res) => {
    await delay(1000);
    const user = req.session.user;
    const matchUser = req.query.matchUser;
    //console.log('Received Date:', matchUser);
    // Load or initialize the users and comments arrays
    const users = loadUserDataFromFile();
    const comments = loadCommentsFromFile();

    if (typeof matchUser === 'undefined') {
        // Handle undefined dob, e.g., show an error message or redirect
        return res.render('home', { user, comments, errorMessage: 'Please provide a valid date of birth.' });
    }

    // Filter users based on the matching DOB
    const matchingUsers = getMatchingUsersBasedOnDOB(matchUser, users);
    // Check if comments is defined before using it
    if (comments) {
        // If the request accepts JSON, send the JSON response
        if (req.accepts('json')) {
            return res.json({ matchingUsers });
        } else {
            // If the matchingUsers array is not empty, render the HTML response
            if (matchingUsers.length > 0) {
                return res.render('search_d', { matchUser, comments, matchingUsers });
            } else {
                return res.status(404).render('search_d', { matchUser, comments, error: `No matching users found for ${matchUser}.` });
            }
        }
    } else {
        // Handle the case where comments is undefined
        console.error('Error: Comments array is not defined');
        return res.render('search_d', { matchUser, comments: [], error: 'An error occurred while loading comments.' });
    }

});





router.post('/comment', async (req, res) => {
    await delay(1000);
    const user = req.session.user;

    // Load or initialize the comments array
    const comments = loadCommentsFromFile();

    // Check if the user is logged in
    if (!user) {
        // Redirect to the login page if not logged in
        return res.redirect('/login');
    }

    const { comment } = req.body;

    // Create a new comment object with the username and email
    const newComment = {
        username: user.firstName,
        email: user.email,
        comment,
        timestamp: new Date().toISOString(),
    };

    // Check if comments is defined before using push
    if (comments) {
        // Add the new comment to the comments array
        comments.push(newComment);

        // Save the updated comments array to the JSON file
        writeCommentsToFile(comments);

        // Redirect back to the home page after submitting the comment
        return res.redirect('/home');
    } else {
        // Handle the case where comments is undefined
        console.error('Error: Comments array is not defined');
        return res.render('home', { user, comments: [], errorMessage: 'An error occurred while loading comments.' });
    }
});

router.use(['/search', '/search_d'], authenticateUser);
// Search route
router.get('/search', async (req, res) => {
    await delay(1000);

    // Check if the user is logged in
    const user = req.session.user;
    if (!user) {
        // Redirect to the login page if not logged in
        return res.redirect('/login');
    }

    // Load or initialize the users and comments arrays
    const birthR = loadBirthDataFromFile();
    const comments = loadCommentsFromFile();

    const searchDob = req.query.dob;

    // Validate searchDob - You may need to adjust this based on your date format
    if (!searchDob || !isValidDate(searchDob)) {
        // Check if comments is defined before using it
        if (comments) {
            // If the request does not accept JSON, render the HTML response
            return res.render('search', { user, comments, error: 'Invalid date format' });
        } else {
            // Handle the case where comments is undefined
            console.error('Error: Comments array is not defined');
            return res.render('search', { user, comments: [], error: 'An error occurred while loading comments.' });
        }
    }

    // Filter users by date of birth
    const matchingUsers = getMatchingUsersBasedOnDOB(searchDob, birthR);

    // Check if comments is defined before using it
    if (comments) {
        // If the request accepts JSON, send the JSON response
        if (req.accepts('json')) {
            return res.json({ matchingUsers });
        }
        if (matchingUsers.length > 0) {
           return res.json({ matchingUsers });
        } else {
            res.status(404).json({ error: `No matching users found for ${searchDob}.` });
        }

    } else {
        // Handle the case where comments is undefined
        console.error('Error: Comments array is not defined');
        return res.render('search', { user, comments: [], error: 'An error occurred while loading comments.' });
    }

});

//< update 11jan2024
router.get('/search_d', async (req, res) => {
    try {
        // Simulate delay with a Promise
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if the user is logged in
        const d_user = req.session.d_user;
        // if (!d_user) {
        // Redirect to the login page if not logged in
        //    return res.redirect('/login');
        //  }

        // Load or initialize the users and comments arrays
        const d_users = loadDeceasedDataFromFile();
        const comments = loadCommentsFromFile();

        const searchDeceased = req.query.Deceased;

        // Validate searchDeceased - You may need to adjust this based on your date format
        if (!searchDeceased || !isValidDate(searchDeceased)) {
            // If the request does not accept JSON, render the HTML response
            if (comments) {
                return res.render('search_d', { d_user, comments, error: 'Invalid date format' });
            } else {
                // Handle the case where comments is undefined
                console.error('Error: Comments array is not defined');
                return res.render('search_d', { d_user, comments: [], error: 'An error occurred while loading comments.' });
            }
        }

        // Filter users by date of death
        const matchingUsers = getMatchingUsersBasedOnDeceased(searchDeceased, d_users);

        // Check if comments is defined before using it
        if (comments) {
            // If the request accepts JSON, send the JSON response
            if (req.accepts('json')) {
                return res.json({ matchingUsers });
            } else {
                // If the matchingUsers array is not empty, render the HTML response
                if (matchingUsers.length > 0) {
                    return res.render('search_d', { d_user, comments, matchingUsers });
                } else {
                    return res.status(404).render('search_d', { d_user, comments, error: `No matching users found for ${searchDeceased}.` });
                }
            }
        } else {
            // Handle the case where comments is undefined
            console.error('Error: Comments array is not defined');
            return res.render('search_d', { d_user, comments: [], error: 'An error occurred while loading comments.' });
        }
    } catch (error) {
        // Handle unexpected errors
        console.error('Unexpected error:', error);
        return res.status(500).render('error', { error: 'An unexpected error occurred.' });
    }
});

router.get('/verification', async (req, res) => {
    await delay(1000);
    res.render('verification');
});

router.get('/settingTool', async (req, res) => {
    await delay(1000);
    res.render('settingTool');
});

//> update

router.get('/logout', async (req, res) => {
    await delay(1000);

    // Destroy the session to log out the user
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        // Redirect to the index page after logout
        res.redirect('/');
    });
});

// Function to validate date format
function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
}

module.exports = router;


