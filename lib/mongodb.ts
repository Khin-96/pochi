import { MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Missing env variable: "MONGODB_URI"');
}

const isDev = process.env.NODE_ENV === "development";
const MONGO_URI = process.env.MONGODB_URI;

const options = {
  serverApi: { version: ServerApiVersion.v1, strict: false, deprecationErrors: true },
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  maxPoolSize: 50,
  minPoolSize: 5,
  connectTimeoutMS: 60000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
  maxIdleTimeMS: 30000,
  w: "majority",
  heartbeatFrequencyMS: 10000,
  monitorCommands: isDev,
};

function enhanceUri(uri: string): string {
  try {
    const url = new URL(uri);
    url.searchParams.set("ssl", "true");
    url.searchParams.set("retryWrites", "true");
    url.searchParams.set("w", "majority");
    return url.toString();
  } catch {
    return uri;
  }
}

const enhancedUri = enhanceUri(MONGO_URI);

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (isDev) {
  const globalWithMongo = global as typeof globalThis & { _mongoClientPromise?: Promise<MongoClient> };
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(enhancedUri, options);

    // Development debugging listeners
    client.on("serverOpening", (event: any) => console.log("🟢 Server opening:", event?.address));
    client.on("serverClosed", (event: any) => console.log("🔴 Server closed:", event?.address));
    client.on("error", (e: any) => console.error("❌ Client error:", e));
    client.on("timeout", () => console.error("⏰ MongoDB timeout"));
    client.on("serverHeartbeatFailed", (e: any) => console.error("💔 Heartbeat failed:", e?.failure));
    client.on("commandStarted", (e: any) => console.debug("📤 Command started:", e?.commandName));
    client.on("commandFailed", (e: any) => console.error("❌ Command failed:", e?.commandName));

    globalWithMongo._mongoClientPromise = client.connect()
      .then(async (c) => {
        console.log("✅ Dev MongoDB connected");
        try {
          const status = await c.db().admin().serverStatus();
          console.log("🔐 SSL Status:", { version: status.version, ok: status.ok });
        } catch (e) {
          console.warn("⚠️ SSL check failed:", e);
        }
        return c;
      })
      .catch((err) => {
        console.error("❌ Dev MongoDB connection failed:", err);
        if (err.message.includes("SSL") || err.message.includes("TLS")) {
          console.error("🧯 SSL/TLS error. Suggestions:", [
            "✅ Check IP whitelisting in Atlas",
            "✅ Make sure URI includes ssl=true",
            "✅ Validate credentials",
            "🔧 Try tlsAllowInvalidCertificates=true if testing"
          ]);
        }
        process.exit(1);
      });
  }
  clientPromise = globalWithMongo._mongoClientPromise!;
} else {
  client = new MongoClient(enhancedUri, options);
  client.on("error", (e: any) => console.error("❌ Prod Mongo error:", e));
  clientPromise = client.connect()
    .then((c) => {
      console.log("🚀 Prod MongoDB connected");
      return c;
    })
    .catch((err) => {
      console.error("❌ Prod connection failed:", err.message);
      throw err;
    });
}

clientPromise.then(async (c) => {
  try {
    const ping = await c.db().command({ ping: 1 });
    const admin = c.db().admin();
    const buildInfo = await admin.buildInfo();
    const dbs = await admin.listDatabases();
    console.log("🏓 Ping:", ping);
    console.log("📊 Build Info:", {
      version: buildInfo.version,
      git: buildInfo.gitVersion,
      ssl: buildInfo.OpenSSLVersion || "Unavailable",
    });
    console.log("📁 DBs:", dbs.databases.map((db) => db.name));
  } catch (e) {
    console.error("❌ MongoDB test failed:", e);
  }
});

export default clientPromise;

export async function checkMongoDBHealth() {
  try {
    const client = await clientPromise;
    const ping = await client.db().command({ ping: 1 });
    const status = await client.db().admin().serverStatus();
    return {
      healthy: ping.ok === 1,
      message: "✅ MongoDB healthy",
      details: {
        version: status.version,
        uptime: status.uptime,
        connections: status.connections,
      },
    };
  } catch (err: any) {
    return {
      healthy: false,
      message: "❌ MongoDB connection failed",
      error: err.message || String(err),
    };
  }
}
