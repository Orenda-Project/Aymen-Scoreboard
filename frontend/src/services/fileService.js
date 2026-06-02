import api from './api';

export const fileService = {
  /**
   * Upload a file for a candidate's file column
   * @param {number} candidateId - Candidate ID
   * @param {number} columnId - Column definition ID
   * @param {File} file - File object to upload
   * @param {Function} onUploadProgress - Progress callback (optional)
   * @returns {Promise}
   */
  upload: async (candidateId, columnId, file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('column_id', columnId);

    const response = await api.post(`/candidates/${candidateId}/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },

  /**
   * Delete a file
   * @param {number} fileId - File ID
   * @returns {Promise}
   */
  delete: async (fileId) => {
    const response = await api.delete(`/files/${fileId}/`);
    return response.data;
  },

  /**
   * Get file details
   * @param {number} fileId - File ID
   * @returns {Promise}
   */
  getById: async (fileId) => {
    const response = await api.get(`/files/${fileId}/`);
    return response.data;
  },

  /**
   * Download a file (opens in new tab)
   * @param {string} fileUrl - File URL
   */
  download: (fileUrl) => {
    window.open(fileUrl, '_blank');
  },

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @param {Object} config - Column configuration with allowedTypes and maxSize
   * @returns {Object} - {valid: boolean, error: string}
   */
  validateFile: (file, config = {}) => {
    const { allowedTypes = [], maxSize = 10485760 } = config; // 10MB default

    // Check file size
    if (file.size > maxSize) {
      const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${sizeMB}MB`,
      };
    }

    // Check file type
    if (allowedTypes.length > 0) {
      const fileExt = file.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExt)) {
        return {
          valid: false,
          error: `File type .${fileExt} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        };
      }
    }

    return { valid: true, error: null };
  },

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted size (e.g., "2.5 MB")
   */
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  },
};

export default fileService;
