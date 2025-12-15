console.log("Hello from Node!");
require('dotenv').config({ path: './.env' });
console.log("MONGO URI is: " + (process.env.MONGODB_URI ? "Defined" : "Undefined"));
