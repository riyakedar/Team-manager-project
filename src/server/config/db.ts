import mongoose from "mongoose";

const DEFAULT_DB_NAME = "team-task-manager";
const DEFAULT_LOCAL_URI = `mongodb://localhost:27017/${DEFAULT_DB_NAME}`;

const readyStateLabels: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

const hasDatabaseName = (uri: string) => {
  try {
    return new URL(uri).pathname.length > 1;
  } catch {
    return false;
  }
};

export const getMongoUri = (isProduction: boolean) => {
  const configuredUri = process.env.MONGODB_URI?.trim();
  if (configuredUri) return configuredUri;

  return isProduction ? "" : DEFAULT_LOCAL_URI;
};

export const getMongoDatabaseName = (uri?: string) => {
  const configuredDbName = process.env.MONGODB_DB_NAME?.trim();
  if (configuredDbName) return configuredDbName;

  return uri && hasDatabaseName(uri) ? undefined : DEFAULT_DB_NAME;
};

export const getMongoConnectionState = () => {
  return readyStateLabels[mongoose.connection.readyState] || "unknown";
};

export const connectToMongoDB = async (isProduction: boolean) => {
  const uri = getMongoUri(isProduction);
  if (!uri) {
    throw new Error("MONGODB_URI is required in production. Add it to your environment variables.");
  }

  const dbName = getMongoDatabaseName(uri);
  await mongoose.connect(uri, {
    ...(dbName ? { dbName } : {}),
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
};

export const closeMongoDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};
