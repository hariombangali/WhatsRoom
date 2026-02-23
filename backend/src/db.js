const mongoose = require("mongoose");
const { config } = require("./config");

async function connectDb() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongodbUri, {
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10
  });
}

async function disconnectDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

module.exports = {
  connectDb,
  disconnectDb
};
