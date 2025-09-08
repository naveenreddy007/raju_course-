require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to connect to the database...');
    await prisma.$connect();
    console.log('Database connection successful!');

    console.log('Attempting to query the "User" table...');
    const userCount = await prisma.user.count();
    console.log(`Successfully queried the database. Found ${userCount} users.`);

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed.');
  }
}

main();