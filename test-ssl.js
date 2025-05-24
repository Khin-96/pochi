// test-ssl.js - Run this to diagnose SSL issues
require('dotenv').config({ path: '.env.local' });

// Rest of your code here...
const { MongoClient } = require('mongodb');

async function testSSLConnection() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  console.log('🔍 Testing MongoDB SSL connection...');
  console.log('URI (masked):', uri.replace(/\/\/.*@/, '//***:***@'));

  const testConfigs = [
    {
      name: 'Standard Atlas Connection',
      options: {
        tls: true,
        tlsAllowInvalidCertificates: false,
        serverSelectionTimeoutMS: 10000
      }
    },
    {
      name: 'Relaxed SSL (Development Only)',
      options: {
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
        serverSelectionTimeoutMS: 10000
      }
    },
    {
      name: 'Legacy SSL',
      options: {
        ssl: true,
        sslValidate: false,
        serverSelectionTimeoutMS: 10000
      }
    }
  ];

  for (const config of testConfigs) {
    console.log(`\n🧪 Testing: ${config.name}`);
    
    let client;
    try {
      client = new MongoClient(uri, config.options);
      
      console.log('  ⏳ Connecting...');
      await client.connect();
      
      console.log('  ⏳ Testing ping...');
      const result = await client.db().command({ ping: 1 });
      
      console.log('  ⏳ Getting server info...');
      const buildInfo = await client.db().admin().buildInfo();
      
      console.log(`  ✅ ${config.name} SUCCESS!`);
      console.log(`     MongoDB Version: ${buildInfo.version}`);
      console.log(`     SSL Support: ${buildInfo.OpenSSLVersion || 'Available'}`);
      
      await client.close();
      console.log('  ✅ Connection closed successfully');
      break; // Success, no need to test other configs
      
    } catch (error) {
      console.log(`  ❌ ${config.name} FAILED:`);
      console.log(`     Error: ${error.message}`);
      
      if (error.message.includes('ENOTFOUND')) {
        console.log('     💡 DNS resolution failed - check your internet connection');
      } else if (error.message.includes('certificate')) {
        console.log('     💡 Certificate error - try tlsAllowInvalidCertificates: true for testing');
      } else if (error.message.includes('timeout')) {
        console.log('     💡 Connection timeout - check firewall and IP whitelist');
      } else if (error.message.includes('authentication')) {
        console.log('     💡 Check your username and password');
      }
      
      if (client) {
        try {
          await client.close();
        } catch (closeError) {
          // Ignore close errors
        }
      }
    }
  }
  
  console.log('\n🔍 Additional Diagnostics:');
  console.log('Node.js version:', process.version);
  console.log('Platform:', process.platform);
  console.log('TLS version support:', process.versions.openssl || 'Unknown');
}

// Run the test
testSSLConnection().catch(console.error);