import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { positionService, columnService } from '../services/positionService';

export const useColumns = (positionId) => {
  const queryClient = useQueryClient();

  // Fetch columns for a position
  const { data, isLoading, error } = useQuery({
    queryKey: ['columns', positionId],
    queryFn: () => positionService.getColumns(positionId),
    enabled: !!positionId,
  });

  // Add column mutation
  const addColumnMutation = useMutation({
    mutationFn: (columnData) => positionService.addColumn(positionId, columnData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', positionId] });
      queryClient.invalidateQueries({ queryKey: ['position', positionId] });
      message.success('Column added successfully');
    },
    onError: (error) => {
      message.error(`Failed to add column: ${error.message}`);
    },
  });

  // Update column mutation
  const updateColumnMutation = useMutation({
    mutationFn: ({ id, data }) => columnService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', positionId] });
      message.success('Column updated successfully');
    },
    onError: (error) => {
      message.error(`Failed to update column: ${error.message}`);
    },
  });

  // Delete column mutation
  const deleteColumnMutation = useMutation({
    mutationFn: (columnId) => columnService.delete(columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', positionId] });
      queryClient.invalidateQueries({ queryKey: ['candidates', positionId] });
      message.success('Column deleted successfully');
    },
    onError: (error) => {
      message.error(`Failed to delete column: ${error.message}`);
    },
  });

  // Reorder columns mutation
  const reorderColumnsMutation = useMutation({
    mutationFn: (columnOrders) => columnService.reorder(positionId, columnOrders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', positionId] });
      message.success('Columns reordered successfully');
    },
    onError: (error) => {
      message.error(`Failed to reorder columns: ${error.message}`);
    },
  });

  return {
    columns: data || [],
    isLoading,
    error,
    addColumn: addColumnMutation.mutate,
    updateColumn: updateColumnMutation.mutate,
    deleteColumn: deleteColumnMutation.mutate,
    reorderColumns: reorderColumnsMutation.mutate,
    isAdding: addColumnMutation.isPending,
    isUpdating: updateColumnMutation.isPending,
    isDeleting: deleteColumnMutation.isPending,
  };
};

export default useColumns;
