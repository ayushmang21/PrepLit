import mongoose from "mongoose";

const formatMongoError = (error) => {
  if (!process.env.MONGODB_URI) {
    return [
      "MongoDB connection failed: MONGODB_URI is missing.",
      "Add MONGODB_URI to backend/.env and restart the server.",
    ].join("\n");
  }

  if (error.code === "ECONNREFUSED" && error.syscall === "querySrv") {
    return [
      "MongoDB connection failed: Atlas SRV DNS lookup was refused.",
      "Your network or DNS resolver is blocking mongodb+srv discovery.",
      "Use the explicit mongodb://host1,host2,host3 URI in backend/.env, or switch to a network that allows SRV lookups.",
      `Resolver hostname: ${error.hostname}`,
    ].join("\n");
  }

  if (error.name === "MongooseServerSelectionError") {
    return [
      "MongoDB connection failed: the database server could not be reached.",
      "Check that your IP is allowed in MongoDB Atlas, the cluster is running, and the URI credentials are correct.",
      `Driver message: ${error.message}`,
    ].join("\n");
  }

  return [
    "MongoDB connection failed.",
    `Driver message: ${error.message}`,
  ].join("\n");
};

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected");
  } catch (error) {
    throw new Error(formatMongoError(error), { cause: error });
  }
};
