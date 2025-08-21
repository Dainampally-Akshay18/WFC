const request = require('supertest');
const app = require('../../../server');
const { User } = require('../../../models');

describe('User Controller', () => {
  let user, mockToken;

  beforeEach(async () => {
    user = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      branch: 'branch1',
      approvalStatus: 'approved',
      firebaseUID: 'test-firebase-uid'
    });

    mockToken = 'mock-firebase-token';
    
    // Mock Firebase authentication
    jest.mock('../../../config/firebase', () => ({
      verifyFirebaseToken: jest.fn().mockResolvedValue({
        uid: 'test-firebase-uid',
        email: 'test@example.com'
      })
    }));
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.email).toBe(user.email);
      expect(response.body.data.name).toBe(user.name);
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.bio).toBe(updateData.bio);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.bio).toBe(updateData.bio);
    });

    it('should return validation error for invalid data', async () => {
      const updateData = {
        name: 'A', // Too short
        bio: 'A'.repeat(501) // Too long
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed');
    });
  });
});
