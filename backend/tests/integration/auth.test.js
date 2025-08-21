const request = require('supertest');
const app = require('../../server');
const { User, Pastor } = require('../../models');

describe('Authentication Integration Tests', () => {
  describe('Complete User Registration Flow', () => {
    it('should complete full user registration and approval flow', async () => {
      // Step 1: Register user
      const userData = {
        email: 'integration@example.com',
        name: 'Integration User',
        bio: 'Integration test user'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.status).toBe('success');
      const userId = registerResponse.body.data.userId;

      // Step 2: Create pastor for approval
      const pastor = await Pastor.create({
        email: 'pastor@example.com',
        name: 'Test Pastor',
        firebaseUID: 'pastor-firebase-uid',
        permissions: {
          manageUsers: true,
          manageBothBranches: true
        }
      });

      // Step 3: Pastor approves user
      const approvalResponse = await request(app)
        .post(`/api/admin/users/${userId}/approve`)
        .set('Authorization', 'Bearer mock-pastor-token')
        .expect(200);

      expect(approvalResponse.body.status).toBe('success');

      // Step 4: Verify user is approved
      const user = await User.findById(userId);
      expect(user.approvalStatus).toBe('approved');
      expect(user.approvedBy.toString()).toBe(pastor._id.toString());
    });
  });

  describe('Content Management Flow', () => {
    it('should complete sermon upload and retrieval flow', async () => {
      // Create pastor
      const pastor = await Pastor.create({
        email: 'pastor@example.com',
        name: 'Test Pastor',
        firebaseUID: 'pastor-firebase-uid',
        permissions: {
          manageSermons: true
        }
      });

      // Create approved user
      const user = await User.create({
        email: 'user@example.com',
        name: 'Test User',
        branch: 'branch1',
        approvalStatus: 'approved',
        firebaseUID: 'user-firebase-uid'
      });

      // Upload sermon (pastor action)
      const sermonData = {
        title: 'Integration Test Sermon',
        description: 'Test sermon for integration testing',
        category: 'Faith',
        videoURL: 'https://example.com/sermon.mp4'
      };

      const uploadResponse = await request(app)
        .post('/api/sermons')
        .set('Authorization', 'Bearer mock-pastor-token')
        .send(sermonData)
        .expect(201);

      expect(uploadResponse.body.status).toBe('success');
      const sermonId = uploadResponse.body.data.sermon._id;

      // Retrieve sermon (user action)
      const retrieveResponse = await request(app)
        .get(`/api/sermons/${sermonId}`)
        .set('Authorization', 'Bearer mock-user-token')
        .expect(200);

      expect(retrieveResponse.body.status).toBe('success');
      expect(retrieveResponse.body.data.title).toBe(sermonData.title);
    });
  });
});
