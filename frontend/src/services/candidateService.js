import api from './api';

export const candidateService = {
  /**
   * Get all candidates with optional filtering
   * @param {Object} params - Query parameters (position, search, column_filters, ordering)
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    // Convert column_filters object to JSON string if present
    if (params.column_filters && typeof params.column_filters === 'object') {
      params.column_filters = JSON.stringify(params.column_filters);
    }

    const response = await api.get('/candidates/', { params });
    return response.data;
  },

  /**
   * Get candidates by position ID
   * @param {number} positionId - Position ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise}
   */
  getByPosition: async (positionId, params = {}) => {
    const response = await api.get('/candidates/', {
      params: { ...params, position: positionId },
    });
    return response.data;
  },

  /**
   * Get a single candidate by ID
   * @param {number} id - Candidate ID
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/candidates/${id}/`);
    return response.data;
  },

  /**
   * Create a new candidate
   * @param {Object} data - Candidate data (position, name, email, phone, initial_data)
   * @returns {Promise}
   */
  create: async (data) => {
    const response = await api.post('/candidates/', data);
    return response.data;
  },

  /**
   * Update a candidate
   * @param {number} id - Candidate ID
   * @param {Object} data - Updated candidate data
   * @returns {Promise}
   */
  update: async (id, data) => {
    const response = await api.put(`/candidates/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a candidate
   * @param {number} id - Candidate ID
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/candidates/${id}/`);
    return response.data;
  },

  /**
   * Bulk update candidate data for custom columns
   * @param {number} candidateId - Candidate ID
   * @param {Array} updates - Array of {column_id, value} objects
   * @returns {Promise}
   */
  updateData: async (candidateId, updates) => {
    const response = await api.put(`/candidates/${candidateId}/data/`, updates);
    return response.data;
  },

  /**
   * Update a single data field for a candidate
   * @param {number} candidateId - Candidate ID
   * @param {number} columnId - Column definition ID
   * @param {any} value - New value
   * @returns {Promise}
   */
  updateDataField: async (candidateId, columnId, value) => {
    return candidateService.updateData(candidateId, [
      { column_id: columnId, value },
    ]);
  },
};

export default candidateService;
