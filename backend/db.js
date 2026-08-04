const mongoose = require('mongoose');
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inotebook?directConnection=true&serverSelectionTimeoutMS=5000&appName=mongosh+1.8.0';

const connectToMongo = async () => {
    if (mongoose.connection.readyState >= 1) {
        return mongoose.connection;
    }

    return mongoose.connect(mongoURI, { autoIndex: true });
};

module.exports = connectToMongo;