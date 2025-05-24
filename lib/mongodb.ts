import { MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

// Modify connection string based on environment
let connectionString = process.env.MONGODB_URI;

// For local development, ensure we're using the correct protocol
if (isDevelopment && connectionString.includes('mongodb+srv://')) {
  connectionString = connectionString.replace('mongodb+srv://', 'mongodb://');
}

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // SSL/TLS configuration
  tls: isProduction, // Enable TLS only in production
  tlsInsecure: isDevelopment, // Allow insecure TLS in development
  tlsAllowInvalidCertificates: isDevelopment, // Allow invalid certs in development
  retryWrites: true,
  w: 'majority',
  // Connection pool options
  maxPoolSize: isDevelopment ? 10 : 50,
  minPoolSize: isDevelopment ? 1 : 5,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  // Server selection timeout
  serverSelectionTimeoutMS: 5000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (isDevelopment) {
  // In development mode, use a global variable to preserve connection across HMR
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(connectionString, options);
    globalWithMongo._mongoClientPromise = client.connect().catch(err => {
      console.error('MongoDB connection error:', err);
      throw err;
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production/test mode, create new connection
  client = new MongoClient(connectionString, options);
  clientPromise = client.connect().catch(err => {
    console.error('MongoDB connection error:', err);
    throw err;
  });
}

// Export the module-scoped MongoClient promise
export default clientPromise;