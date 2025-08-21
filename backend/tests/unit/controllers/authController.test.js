const request = require('supertest');
const app = require('../../../server');
const { User, Pastor } = require('../../../models');

describe('Authentication Controller', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        bio: 'Test bio'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.email).toBe(userData.email);

      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);
    });

    it('should return validation error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User'
      };

      await User.create(userData);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/select-branch', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        firebaseUID: 'test-firebase-uid'
      });
    });

    it('should select branch successfully', async () => {
      const mockToken = 'mock-firebase-token';
      
      // Mock Firebase token verification
      jest.mock('../../../config/firebase', () => ({
        verifyFirebaseToken: jest.fn().mockResolvedValue({
          uid: 'test-firebase-uid',
          email: 'test@example.com'
        })
      }));

      const response = await request(app)
        .post('/api/auth/select-branch')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ branch: 'branch1' })
        .expect(200);

      expect(response.body.status).toBe('success');
      
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.branch).toBe('branch1');
    });

    it('should return error for invalid branch', async () => {
      const mockToken = 'mock-firebase-token';

      const response = await request(app)
        .post('/api/auth/select-branch')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ branch: 'invalid-branch' })
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });
});
