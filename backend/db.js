const mongoose = require('mongoose');
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inotebook?directConnection=true&serverSelectionTimeoutMS=5000&appName=mongosh+1.8.0';

const connectToMongo = async () => {
    if (mongoose.connection.readyState >= 1) {
        return mongoose.connection;
    }

    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(mongoURI, {
        autoIndex: true,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully');
    return conn;
};

module.exports = connectToMongo;