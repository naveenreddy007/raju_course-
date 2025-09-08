const crypto = require('crypto');

// Generate a secure random secret
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

// Generate a strong NEXTAUTH_SECRET
const nextAuthSecret = generateSecret();

// Generate a strong RAZORPAY_SECRET (for testing purposes)
const razorpaySecret = 'rzp_test_' + generateSecret(16).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);

console.log('='.repeat(60));
console.log('SECURE SECRETS GENERATION');
console.log('='.repeat(60));

console.log('\nGenerated Secrets:');
console.log('NEXTAUTH_SECRET=' + nextAuthSecret);
console.log('RAZORPAY_SECRET=' + razorpaySecret);
console.log('SMTP_USER=your-email@gmail.com');
console.log('SMTP_PASS=your-app-password');

console.log('\n' + '='.repeat(60));
console.log('IMPORTANT NOTES');
console.log('='.repeat(60));

console.log('\n1. Replace the placeholder values in your .env file with the generated secrets above.');
console.log('2. For SMTP_USER and SMTP_PASS, use your actual Gmail address and app password.');
console.log('3. For production use, generate these secrets yourself or use a secure secret management service.');
console.log('4. Never commit actual secrets to version control.');

console.log('\n' + '='.repeat(60));
console.log('GENERATION COMPLETE');
console.log('='.repeat(60));