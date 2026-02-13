const { greet, calculateSum, validateEmail } = require('./utils');
const { healthCheck, getStatus } = require('./api');

const PORT = process.env.PORT || 3000;

function main() {
  console.log(greet('GitHub Actions'));
  console.log('Sum of 1-10:', calculateSum([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  console.log('Valid email test@example.com:', validateEmail('test@example.com'));
  console.log('Health check:', healthCheck());
  console.log('Status:', getStatus());
}

if (require.main === module) {
  main();
}

module.exports = { main };
