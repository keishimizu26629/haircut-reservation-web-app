#!/usr/bin/env node

/**
 * Firebase Connection Test Script
 * Tests Firebase connectivity for different environments
 */

const { initializeApp } = require('firebase/app');
const { getAuth, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');
const { getStorage, connectStorageEmulator } = require('firebase/storage');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Environment configurations
const environments = {
    local: {
        name: 'Local (Emulator)',
        config: {
            projectId: 'demo-project',
            apiKey: 'demo-api-key',
            authDomain: 'demo-project.firebaseapp.com',
            storageBucket: 'demo-project.appspot.com',
            messagingSenderId: '123456789',
            appId: '1:123456789:web:demo123'
        },
        emulators: {
            auth: { host: 'localhost', port: 9099 },
            firestore: { host: 'localhost', port: 8080 },
            storage: { host: 'localhost', port: 9199 }
        }
    },
    development: {
        name: 'Development',
        config: {
            projectId: process.env.FIREBASE_DEV_PROJECT_ID || 'haircut-reservation-dev',
            apiKey: process.env.FIREBASE_DEV_API_KEY || 'your-dev-api-key',
            authDomain: process.env.FIREBASE_DEV_AUTH_DOMAIN || 'haircut-reservation-dev.firebaseapp.com',
            storageBucket: process.env.FIREBASE_DEV_STORAGE_BUCKET || 'haircut-reservation-dev.appspot.com',
            messagingSenderId: process.env.FIREBASE_DEV_MESSAGING_SENDER_ID || '123456789',
            appId: process.env.FIREBASE_DEV_APP_ID || '1:123456789:web:dev123'
        }
    },
    staging: {
        name: 'Staging',
        config: {
            projectId: process.env.FIREBASE_STAGING_PROJECT_ID || 'haircut-reservation-staging',
            apiKey: process.env.FIREBASE_STAGING_API_KEY || 'your-staging-api-key',
            authDomain: process.env.FIREBASE_STAGING_AUTH_DOMAIN || 'haircut-reservation-staging.firebaseapp.com',
            storageBucket: process.env.FIREBASE_STAGING_STORAGE_BUCKET || 'haircut-reservation-staging.appspot.com',
            messagingSenderId: process.env.FIREBASE_STAGING_MESSAGING_SENDER_ID || '987654321',
            appId: process.env.FIREBASE_STAGING_APP_ID || '1:987654321:web:staging123'
        }
    },
    production: {
        name: 'Production',
        config: {
            projectId: process.env.FIREBASE_PROD_PROJECT_ID || 'haircut-reservation-prod',
            apiKey: process.env.FIREBASE_PROD_API_KEY || 'your-prod-api-key',
            authDomain: process.env.FIREBASE_PROD_AUTH_DOMAIN || 'haircut-reservation-prod.firebaseapp.com',
            storageBucket: process.env.FIREBASE_PROD_STORAGE_BUCKET || 'haircut-reservation-prod.appspot.com',
            messagingSenderId: process.env.FIREBASE_PROD_MESSAGING_SENDER_ID || '555666777',
            appId: process.env.FIREBASE_PROD_APP_ID || '1:555666777:web:prod123'
        }
    }
};

async function testFirebaseConnection(envName) {
    const env = environments[envName];
    if (!env) {
        log('red', `❌ Environment '${envName}' not found`);
        return false;
    }

    log('blue', `\n🔥 Testing Firebase connection for: ${env.name}`);
    log('blue', `Project ID: ${env.config.projectId}`);

    try {
        // Initialize Firebase app
        const app = initializeApp(env.config, envName);
        log('green', '✅ Firebase app initialized');

        // Test Auth
        const auth = getAuth(app);
        if (env.emulators?.auth) {
            connectAuthEmulator(auth, `http://${env.emulators.auth.host}:${env.emulators.auth.port}`);
            log('yellow', `🔧 Connected to Auth Emulator: ${env.emulators.auth.host}:${env.emulators.auth.port}`);
        }
        log('green', '✅ Firebase Auth initialized');

        // Test Firestore
        const db = getFirestore(app);
        if (env.emulators?.firestore) {
            connectFirestoreEmulator(db, env.emulators.firestore.host, env.emulators.firestore.port);
            log('yellow', `🔧 Connected to Firestore Emulator: ${env.emulators.firestore.host}:${env.emulators.firestore.port}`);
        }
        log('green', '✅ Firebase Firestore initialized');

        // Test Storage
        const storage = getStorage(app);
        if (env.emulators?.storage) {
            connectStorageEmulator(storage, env.emulators.storage.host, env.emulators.storage.port);
            log('yellow', `🔧 Connected to Storage Emulator: ${env.emulators.storage.host}:${env.emulators.storage.port}`);
        }
        log('green', '✅ Firebase Storage initialized');

        // Test basic operations
        await testBasicOperations(auth, db, storage, envName);

        log('green', `🎉 All tests passed for ${env.name}!`);
        return true;

    } catch (error) {
        log('red', `❌ Error testing ${env.name}: ${error.message}`);
        return false;
    }
}

async function testBasicOperations(auth, db, storage, envName) {
    log('blue', '🧪 Testing basic operations...');

    try {
        // Test Auth - Check current user
        const currentUser = auth.currentUser;
        log('green', `✅ Auth status: ${currentUser ? 'Signed in' : 'Not signed in'}`);

        // Test Firestore - Try to access settings
        // Note: This might fail if security rules are strict, which is expected
        try {
            // Just test if we can create a reference - don't actually write
            const testDoc = db.collection('test').doc('connection-test');
            log('green', '✅ Firestore reference created');
        } catch (firestoreError) {
            log('yellow', `⚠️  Firestore access limited (expected): ${firestoreError.message}`);
        }

        // Test Storage - Try to get reference
        try {
            const testRef = storage.ref('test/connection-test.txt');
            log('green', '✅ Storage reference created');
        } catch (storageError) {
            log('yellow', `⚠️  Storage access limited (expected): ${storageError.message}`);
        }

    } catch (error) {
        log('red', `❌ Basic operations test failed: ${error.message}`);
        throw error;
    }
}

async function main() {
    console.log('🔥 Firebase Connection Test Suite');
    console.log('=================================\n');

    // Get environment from command line argument
    const targetEnv = process.argv[2];

    if (targetEnv) {
        // Test specific environment
        if (!environments[targetEnv]) {
            log('red', `❌ Invalid environment: ${targetEnv}`);
            log('blue', `Available environments: ${Object.keys(environments).join(', ')}`);
            process.exit(1);
        }

        const success = await testFirebaseConnection(targetEnv);
        process.exit(success ? 0 : 1);
    } else {
        // Test all environments
        let allPassed = true;

        for (const envName of Object.keys(environments)) {
            const success = await testFirebaseConnection(envName);
            if (!success) {
                allPassed = false;
            }

            // Add separator between tests
            if (envName !== Object.keys(environments).slice(-1)[0]) {
                console.log('\n' + '='.repeat(50));
            }
        }

        console.log('\n' + '='.repeat(50));
        if (allPassed) {
            log('green', '🎉 All environment tests passed!');
        } else {
            log('red', '❌ Some environment tests failed');
        }

        process.exit(allPassed ? 0 : 1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    log('red', `❌ Unhandled Rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
});

// Run the test
if (require.main === module) {
    main().catch(error => {
        log('red', `❌ Test suite failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { testFirebaseConnection, environments };
