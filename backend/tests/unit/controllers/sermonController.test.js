const request = require('supertest');
const app = require('../../../server');
const { Sermon, Pastor } = require('../../../models');

describe('Sermon Controller', () => {
  let pastor, mockToken;

  beforeEach(async () => {
    pastor = await Pastor.create({
      email: 'pastor@example.com',
      name: 'Test Pastor',
      firebaseUID: 'pastor-firebase-uid',
      permissions: {
        manageSermons: true,
        manageContent: true
      }
    });

    mockToken = 'mock-pastor-token';
    
    // Mock Firebase authentication for pastor
    jest.mock('../../../config/firebase', () => ({
      verifyFirebaseToken: jest.fn().mockResolvedValue({
        uid: 'pastor-firebase-uid',
        email: 'pastor@example.com'
      })
    }));
  });

  describe('GET /api/sermons', () => {
    beforeEach(async () => {
      await Sermon.create([
        {
          title: 'Test Sermon 1',
          description: 'Test description 1',
          category: 'Faith',
          videoURL: 'https://example.com/video1.mp4',
          uploadedBy: pastor._id
        },
        {
          title: 'Test Sermon 2',
          description: 'Test description 2',
          category: 'Hope',
          videoURL: 'https://example.com/video2.mp4',
          uploadedBy: pastor._id
        }
      ]);
    });

    it('should get all sermons successfully', async () => {
      const response = await request(app)
        .get('/api/sermons')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter sermons by category', async () => {
      const response = await request(app)
        .get('/api/sermons?category=Faith')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('Faith');
    });

    it('should paginate sermons correctly', async () => {
      const response = await request(app)
        .get('/api/sermons?page=1&limit=1')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.current_page).toBe(1);
      expect(response.body.pagination.per_page).toBe(1);
    });
  });

  describe('GET /api/sermons/:id', () => {
    let sermon;

    beforeEach(async () => {
      sermon = await Sermon.create({
        title: 'Test Sermon',
        description: 'Test description',
        category: 'Faith',
        videoURL: 'https://example.com/video.mp4',
        uploadedBy: pastor._id,
        views: 0
      });
    });

    it('should get sermon by ID and increment views', async () => {
      const response = await request(app)
        .get(`/api/sermons/${sermon._id}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe(sermon.title);

      const updatedSermon = await Sermon.findById(sermon._id);
      expect(updatedSermon.views).toBe(1);
    });

    it('should return 404 for non-existent sermon', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/sermons/${fakeId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
    });
  });
});
