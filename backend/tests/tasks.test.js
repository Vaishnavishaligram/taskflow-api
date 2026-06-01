const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Task = require('../src/models/Task');

let userToken, adminToken, userId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/taskapi_test');

  // Create user
  const userRes = await request(app).post('/api/v1/auth/register')
    .send({ name: 'Task User', email: 'taskuser@test.com', password: 'test123' });
  userToken = userRes.body.data.accessToken;
  userId = userRes.body.data.user.id;

  // Create admin
  const adminUser = await User.create({
    name: 'Admin', email: 'admin@test.com', password: 'admin123', role: 'admin',
  });
  const adminRes = await request(app).post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'admin123' });
  adminToken = adminRes.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  await Task.deleteMany({});
});

describe('POST /api/v1/tasks', () => {
  it('should create a task', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test Task', priority: 'high' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Test Task');
  });

  it('should reject task with short title', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'AB' });

    expect(res.status).toBe(422);
  });

  it('should require auth', async () => {
    const res = await request(app).post('/api/v1/tasks').send({ title: 'Test' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/tasks', () => {
  it('should return paginated tasks', async () => {
    await Task.create([
      { title: 'Task One', createdBy: userId },
      { title: 'Task Two', createdBy: userId },
    ]);

    const res = await request(app)
      .get('/api/v1/tasks?page=1&limit=10')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBe(2);
  });
});

describe('PUT /api/v1/tasks/:id', () => {
  it('should update own task', async () => {
    const task = await Task.create({ title: 'Old Title', createdBy: userId });

    const res = await request(app)
      .put(`/api/v1/tasks/${task._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'New Title', status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('New Title');
    expect(res.body.data.status).toBe('done');
  });
});

describe('DELETE /api/v1/tasks/:id', () => {
  it('should delete own task', async () => {
    const task = await Task.create({ title: 'Delete Me', createdBy: userId });

    const res = await request(app)
      .delete(`/api/v1/tasks/${task._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    const found = await Task.findById(task._id);
    expect(found).toBeNull();
  });
});
