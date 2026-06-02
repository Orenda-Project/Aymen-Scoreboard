import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import positionService from '../services/positionService';

export const usePositions = (params = {}) => {
  const queryClient = useQueryClient();

  // Fetch all positions
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['positions', params],
    queryFn: () => positionService.getAll(params),
  });

  // Create position mutation
  const createMutation = useMutation({
    mutationFn: (data) => positionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      message.success('Position created successfully');
    },
    onError: (error) => {
      message.error(`Failed to create position: ${error.message}`);
    },
  });

  // Update position mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => positionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      message.success('Position updated successfully');
    },
    onError: (error) => {
      message.error(`Failed to update position: ${error.message}`);
    },
  });

  // Delete position mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => positionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      message.success('Position deleted successfully');
    },
    onError: (error) => {
      message.error(`Failed to delete position: ${error.message}`);
    },
  });

  return {
    positions: data?.results || data || [],
    isLoading,
    error,
    refetch,
    createPosition: createMutation.mutate,
    updatePosition: updateMutation.mutate,
    deletePosition: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const usePosition = (positionId) => {
  // Fetch single position
  const { data, isLoading, error } = useQuery({
    queryKey: ['position', positionId],
    queryFn: () => positionService.getById(positionId),
    enabled: !!positionId,
  });

  return {
    position: data,
    isLoading,
    error,
  };
};

export default usePositions;
