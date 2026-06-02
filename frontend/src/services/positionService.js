import api from './api';

export const positionService = {
  /**
   * Get all positions
   * @param {Object} params - Query parameters (is_active, search, ordering)
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/positions/', { params });
    return response.data;
  },

  /**
   * Get a single position by ID
   * @param {number} id - Position ID
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/positions/${id}/`);
    return response.data;
  },

  /**
   * Create a new position
   * @param {Object} data - Position data (name, description, is_active)
   * @returns {Promise}
   */
  create: async (data) => {
    const response = await api.post('/positions/', data);
    return response.data;
  },

  /**
   * Update a position
   * @param {number} id - Position ID
   * @param {Object} data - Updated position data
   * @returns {Promise}
   */
  update: async (id, data) => {
    const response = await api.put(`/positions/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a position
   * @param {number} id - Position ID
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/positions/${id}/`);
    return response.data;
  },

  /**
   * Get all columns for a position
   * @param {number} positionId - Position ID
   * @returns {Promise}
   */
  getColumns: async (positionId) => {
    const response = await api.get(`/positions/${positionId}/columns/`);
    return response.data;
  },

  /**
   * Add a column to a position
   * @param {number} positionId - Position ID
   * @param {Object} columnData - Column definition data
   * @returns {Promise}
   */
  addColumn: async (positionId, columnData) => {
    const response = await api.post(`/positions/${positionId}/columns/`, columnData);
    return response.data;
  },
};

export const columnService = {
  /**
   * Update a column definition
   * @param {number} id - Column ID
   * @param {Object} data - Updated column data
   * @returns {Promise}
   */
  update: async (id, data) => {
    const response = await api.put(`/columns/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a column definition
   * @param {number} id - Column ID
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/columns/${id}/`);
    return response.data;
  },

  /**
   * Reorder columns for a position
   * @param {number} positionId - Position ID
   * @param {Array} columnOrders - Array of {id, order} objects
   * @returns {Promise}
   */
  reorder: async (positionId, columnOrders) => {
    const response = await api.post('/columns/reorder/', {
      position_id: positionId,
      column_orders: columnOrders,
    });
    return response.data;
  },
};

export default positionService;
