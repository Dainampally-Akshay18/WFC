import api from './api'; // Assuming you have a central axios instance at 'services/api.js'

/**
 * Submits a new prayer request to the backend.
 * @param {object} prayerData - The form data for the new prayer request.
 * @returns {Promise<object>} The newly created prayer request object.
 */
export const submitPrayer = async (prayerData) => {
  try {
    const response = await api.post('/prayers', prayerData);
    return response.data;
  } catch (error) {
    // Log and re-throw for the component to handle
    console.error('Error submitting prayer request:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to submit prayer request');
  }
};

/**
 * Fetches a paginated list of prayer requests.
 * @param {object} params - Query parameters for filtering, sorting, and pagination.
 * e.g., { status: 'active', page: 1, limit: 10 }
 * @returns {Promise<object>} The paginated response with prayers and metadata.
 */
export const getPrayers = async (params = {}) => {
  try {
    const response = await api.get('/prayers', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching prayer requests:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch prayer requests');
  }
};

/**
 * Adds a prayer for a specific prayer request.
 * @param {string} prayerId - The ID of the prayer request to pray for.
 * @returns {Promise<object>} The updated prayer count.
 */
export const addPrayer = async (prayerId) => {
  try {
    const response = await api.post(`/prayers/${prayerId}/pray`);
    return response.data;
  } catch (error) {
    console.error('Error adding prayer:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to add prayer');
  }
};

/**
 * Fetches a single prayer request by its ID.
 * @param {string} prayerId - The ID of the prayer request.
 * @returns {Promise<object>} The prayer request object.
 */
export const getPrayerById = async (prayerId) => {
  try {
    const response = await api.get(`/prayers/${prayerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching prayer request:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch prayer request');
  }
};