const request = require('supertest');
const server = require('./server');
const db = require('./../data/dbConfig');
const Users = require('./users/users-model');

beforeAll(async () => {
  await db.migrate.rollback()
  await db.migrate.latest()
})
beforeEach(async () => {
  await db('users').truncate()
})
afterAll(async () => {
  await db.destroy()
})

const daniel = { username: 'dvargas', password: '1234' };
const bob = { username: 'bobbo' };

describe('endpoints', () => {
  describe('[POST] /api/auth/register', () => {
    it('adds a new user to the database', async () => {
      let res = await request(server).post('/api/auth/register').send(daniel);
      expect(res.status).toBe(201); 
      // res = await Users.getAll();
      // expect(res.body).toHaveLength(1); 
    })
    it('responds with the newly created user', async () => {
      let res = await request(server).post('/api/auth/register').send(daniel);
      expect(res.body.username).toBe('dvargas');
    }) 
    it('responds with a 400 if invalid credentials', async () => {
      let res = await request(server).post('/api/auth/register').send(bob);
      expect(res.status).toBe(400);
    })
  })

  describe('[POST] /api/auth/login', () => {
    it('responds with the logged in user and a token', async () => {
      let res = await request(server).post('/api/auth/register').send(daniel); 
      res = await request(server).post('/api/auth/login').send(daniel); 
      expect(res.body.message.substring(9)).toBe('dvargas!');
      expect(res.body.token).toBeTruthy(); 
    }) 
    it('responds with a 400 if invalid credentials', async () => {
      let res = await request(server).post('/api/auth/login').send(bob);
      expect(res.status).toBe(400);
    })
  })
  
  describe('[GET] /api/jokes', () => {
    it('it responds with 200 OK if token valid', async () => {
      await request(server).post('/api/auth/register').send(daniel); 
      const { body: { token } } = await request(server).post('/api/auth/login').send(daniel)
      const res = await request(server).get('/api/jokes').set('Authorization', token)
      expect(res.status).toBe(200);
    })  
    it('it responds jokes if token valid', async () => {
      await request(server).post('/api/auth/register').send(daniel); 
      const { body: { token } } = await request(server).post('/api/auth/login').send(daniel)
      const res = await request(server).get('/api/jokes').set('Authorization', token)
      expect(res.body).toHaveLength(3);
    })  
    it('it responds with 401 if no token', async () => {
      let res = await request(server).get('/api/jokes');
      expect(res.status).toBe(401);
    })
  })
})

