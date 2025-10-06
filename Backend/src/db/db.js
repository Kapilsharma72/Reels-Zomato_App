const mongoose = require("mongoose");


function connectDB() {
    const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/reel-zomato";
    console.log("Connecting to MongoDB:", dbUrl);
    
    mongoose.connect(dbUrl)
        .then(() => {
            console.log("Connected to MongoDB successfully");
        })
        .catch((error) => {
            console.error("Error connecting to MongoDB:", error);
        });
}

module.exports = connectDB;