function greet(name) {
  return `Hello, ${name}!`;
}

function calculateSum(numbers) {
  return numbers.reduce((sum, num) => sum + num, 0);
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = { greet, calculateSum, validateEmail };
