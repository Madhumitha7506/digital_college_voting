// backend/test-notifications.js
require('dotenv').config({ path: '../.env' });
const { sendKycApprovalEmail, sendKycApprovalSMS_MSG91 } = require('./utils/notifications');

// Debug: Print environment variables
console.log('=== Environment Variables Check ===');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set (hidden)' : '❌ Missing');
console.log('MSG91_AUTH_KEY:', process.env.MSG91_AUTH_KEY ? '✅ Set (hidden)' : '❌ Missing');
console.log('');

async function test() {
  console.log('Testing Email...');
  const emailResult = await sendKycApprovalEmail('abiramidev1996@gmail.com', 'Test User');
  console.log('Email Result:', emailResult);

  console.log('\nTesting SMS...');
  const smsResult = await sendKycApprovalSMS_MSG91('9092511853', 'Test User');
  console.log('SMS Result:', smsResult);
}

test();