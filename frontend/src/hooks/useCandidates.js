import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import candidateService from '../services/candidateService';

export const useCandidates = (positionId, filters = {}) => {
  const queryClient = useQueryClient();

  // Fetch candidates for a position
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['candidates', positionId, filters],
    queryFn: () => candidateService.getByPosition(positionId, filters),
    enabled: !!positionId,
  });

  // Create candidate mutation
  const createMutation = useMutation({
    mutationFn: (data) => candidateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', positionId] });
      message.success('Candidate added successfully');
    },
    onError: (error) => {
      message.error(`Failed to add candidate: ${error.message}`);
    },
  });

  // Update candidate mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => candidateService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', positionId] });
      message.success('Candidate updated successfully');
    },
    onError: (error) => {
      message.error(`Failed to update candidate: ${error.message}`);
    },
  });

  // Delete candidate mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => candidateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', positionId] });
      message.success('Candidate deleted successfully');
    },
    onError: (error) => {
      message.error(`Failed to delete candidate: ${error.message}`);
    },
  });

  // Update candidate data mutation
  const updateDataMutation = useMutation({
    mutationFn: ({ candidateId, columnId, value }) =>
      candidateService.updateDataField(candidateId, columnId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', positionId] });
    },
    onError: (error) => {
      message.error(`Failed to update data: ${error.message}`);
    },
  });

  return {
    candidates: data?.results || data || [],
    isLoading,
    error,
    refetch,
    createCandidate: createMutation.mutate,
    updateCandidate: updateMutation.mutate,
    deleteCandidate: deleteMutation.mutate,
    updateCandidateData: updateDataMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export default useCandidates;
