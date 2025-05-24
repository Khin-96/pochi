import { MongoClient, ServerApiVersion } from 'mongodb';

const isDevelopment = process.env.NODE_ENV !== 'production';

console.log('TLS/SSL Environment Info:', {
  nodeVersion: process.version,
  opensslVersion: process.versions.openssl,
  platform: process.platform
});

const uri = validateAndEnhanceConnectionString(process.env.MONGODB_URI!);

if (!uri) {
  throw new Error('❌ MONGODB_URI environment variable is not defined.');
}

const atlasOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  tls: true,
  minTLSVersion: 'TLSv1.2',
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,

  maxPoolSize: 50,
  minPoolSize: 5,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 30000,

  retryWrites: true,
  retryReads: true,
};

const client = new MongoClient(uri, atlasOptions);

let clientPromise: Promise<MongoClient>;

clientPromise = client.connect()
  .then(async (connectedClient) => {
    console.log('✅ MongoDB connected successfully');

    try {
      const admin = connectedClient.db().admin();
      const serverStatus = await admin.serverStatus();
      console.log('🔐 TLS Connection Info:', {
        version: serverStatus.version,
        tlsSupported: true,
        tlsVersion: serverStatus.openssl?.version || 'unknown'
      });
    } catch (sslError) {
      console.error('⚠️ TLS verification failed:', sslError);
      throw new Error('TLS handshake failed with MongoDB Atlas');
    }

    return connectedClient;
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', {
      message: err.message,
      code: err.code,
      stack: isDevelopment ? err.stack : undefined
    });

    if (err.message.includes('SSL') || err.message.includes('TLS')) {
      console.error('🔐 TLS Connection Troubleshooting:');
      console.error('1. Ensure your network allows outbound TLS 1.2+ connections');
      console.error('2. Verify your MongoDB Atlas IP whitelist includes your current IP');
      console.error('3. Try updating your Node.js version (current:', process.version, ')');
      console.error('4. Check your system time - incorrect time can cause TLS failures');
    }

    throw err;
  });

function validateAndEnhanceConnectionString(uri: string): string {
  try {
    const url = new URL(uri);
    url.searchParams.set('tls', 'true');
    url.searchParams.set('retryWrites', 'true');
    url.searchParams.set('w', 'majority');
    url.searchParams.delete('ssl');
    url.searchParams.delete('sslValidate');
    return url.toString();
  } catch (error) {
    console.error('Invalid MongoDB URI format:', error);
    return uri;
  }
}

export default clientPromise;
