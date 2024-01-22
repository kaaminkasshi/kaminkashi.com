// middleware/middlewareFunctions.js

// Function to introduce a delay (in milliseconds)
async function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

module.exports = {
    delay,
   
};
