/**
 * Database Seed Script
 * Run: node scripts/seed.js
 * Seeds: 1 admin user, 2 regular users, and 10 sample tasks
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Task = require('../src/models/Task');
const logger = require('../src/utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskapi';

const users = [
  { name: 'Admin User', email: 'admin@test.com', password: 'admin123', role: 'admin' },
  { name: 'Alice Johnson', email: 'alice@test.com', password: 'alice123', role: 'user' },
  { name: 'Bob Smith', email: 'bob@test.com', password: 'bob123', role: 'user' },
];

const sampleTasks = (userId) => [
  {
    title: 'Design authentication flow',
    description: 'Create wireframes for login, register, and password reset screens',
    status: 'done', priority: 'high',
    tags: ['design', 'auth'],
    createdBy: userId,
  },
  {
    title: 'Implement JWT middleware',
    description: 'Add token verification and refresh logic to Express middleware',
    status: 'done', priority: 'high',
    tags: ['backend', 'security'],
    createdBy: userId,
  },
  {
    title: 'Write API documentation',
    description: 'Document all endpoints with Swagger/OpenAPI spec',
    status: 'in-progress', priority: 'medium',
    tags: ['docs'],
    createdBy: userId,
  },
  {
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment',
    status: 'todo', priority: 'medium',
    tags: ['devops'],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdBy: userId,
  },
  {
    title: 'Add Redis caching',
    description: 'Cache frequently accessed endpoints to improve performance',
    status: 'todo', priority: 'low',
    tags: ['performance', 'redis'],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    createdBy: userId,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Task.deleteMany({});
    logger.info('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
      logger.info(`Created user: ${user.email} (${user.role})`);
    }

    // Create tasks for each user
    for (const user of createdUsers) {
      const tasks = sampleTasks(user._id);
      await Task.insertMany(tasks);
      logger.info(`Created ${tasks.length} tasks for ${user.email}`);
    }

    logger.info('\n✅ Seed complete!');
    logger.info('─────────────────────────────');
    logger.info('Test credentials:');
    users.forEach(u => {
      logger.info(`  ${u.role.padEnd(5)} | ${u.email} / ${u.password}`);
    });
    logger.info('─────────────────────────────');

  } catch (err) {
    logger.error('Seed failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
