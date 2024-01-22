const fs = require('fs');

// File paths
const userDataFilePath = './data/Users.json'; 
const commentsFilePath = './data/USER_Comments.json';
const deceasedUsersPath = './data/DECEASED_USERS.json'; //<updates 11jan2024
const BirthDataFromPath = './data/DOB_DATA.json';

// Function to read user data from Users.json
function loadUserDataFromFile() {
    try {
        const data = fs.readFileSync(userDataFilePath);
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading Users.json:', error);
        return [];
    }
} 

//<updates 13jan2024 
function loadBirthDataFromFile() {
    try {
        const data = fs.readFileSync(BirthDataFromPath);
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading DOB_DATA.json:', error);
        return [];
    }
} 
//updates

//<updates 11jan2024 
function loadDeceasedDataFromFile() {
    try {
        const data = fs.readFileSync(deceasedUsersPath);
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading DECEASED_USERS.json:', error);
        return [];
    }
} 
//updates

// Function to read comments data from USER_Comments.json
function loadCommentsFromFile() {
    try {
        if (fs.existsSync(commentsFilePath)) {
            const data = fs.readFileSync(commentsFilePath);
            return JSON.parse(data);
        } else {
            console.error(`Error: ${commentsFilePath} does not exist.`);
            return [];
        }
    } catch (error) {
        console.error('Error reading USER_Comments.json:', error);
        return [];
    }
}


// Function to write users data to USER_DATA_API.json
function writeUserDataToFile(users) {
    fs.writeFile(userDataFilePath, JSON.stringify(users, null, 2), (err) => {
        if (err) {
            console.error('Error writing to Users.json:', err);
        }
    });
} 

// Function to write users data to USER_DATA_API.json
function writeBirthDataToFile(birthR) {
    fs.writeFile(BirthDataFromPath, JSON.stringify(birthR, null, 2), (err) => {
        if (err) {
            console.error('Error writing to DOB_DATA.json:', err);
        }
    });
} 


//<updates 11jan2024 
function writeDeceasedDataToFile(D_users) {
    fs.writeFile(deceasedUsersPath, JSON.stringify(D_users, null, 2), (err) => {
        if (err) {
            console.error('Error writing to DECEASED_USERS.json:', err);
        }
    });
} 
//>updates

// Function to write comments data to USER_Comments.json
function writeCommentsToFile(comments) {
    fs.writeFile(commentsFilePath, JSON.stringify(comments, null, 2), (err) => {
        if (err) {
            console.error('Error writing to USER_Comments.json:', err);
        }
    });
} 

module.exports = {
    loadUserDataFromFile,
    loadCommentsFromFile,
    writeUserDataToFile,
    writeCommentsToFile,
    loadBirthDataFromFile,
    loadDeceasedDataFromFile,
    writeDeceasedDataToFile,
    writeBirthDataToFile,
    
};