const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.api = functions.region('asia-northeast1').https.onRequest((req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Firebase Functions API is running',
    timestamp: new Date().toISOString()
  });
});

exports.healthCheck = functions.region('asia-northeast1').https.onRequest((req, res) => {
  res.status(200).send('OK');
});