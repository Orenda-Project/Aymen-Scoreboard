import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import fileService from '../services/fileService';

export const useFileUpload = (positionId) => {
  const queryClient = useQueryClient();

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: ({ candidateId, columnId, file, onProgress }) =>
      fileService.upload(candidateId, columnId, file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', positionId] });
      message.success('File uploaded successfully');
    },
    onError: (error) => {
      message.error(`Upload failed: ${error.message}`);
    },
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: (fileId) => fileService.delete(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', positionId] });
      message.success('File deleted successfully');
    },
    onError: (error) => {
      message.error(`Failed to delete file: ${error.message}`);
    },
  });

  return {
    uploadFile: uploadMutation.mutate,
    deleteFile: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    uploadProgress: 0, // Can be tracked via onProgress callback
  };
};

export default useFileUpload;
