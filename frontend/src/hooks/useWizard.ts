import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useWizardState() {
  return useQuery({
    queryKey: ['wizard', 'state'],
    queryFn: async () => {
      const response = await api.get('/api/wizard/state');
      return response.data;
    },
    staleTime: 1000,
  });
}

export function useWizardStep(step: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/api/wizard/step/${step}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wizard', 'state'] });
    },
    onError: (error: any) => {
      console.error(`Wizard step ${step} save failed`, error);
      if (error?.response) {
        console.error('Wizard API response data:', error.response.data);
      }
    },
  });
}

export function useResetWizard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/wizard/reset', {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wizard'] });
    },
  });
}

export function useCalculateEstimation() {
  return useMutation({
    mutationFn: async (state: any) => {
      const response = await api.post('/api/estimation/calculate', state);
      return response.data;
    },
  });
}

export function useExport(format: 'xml' | 'excel' | 'pdf') {
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/api/export/${format}`, data, {
        responseType: 'blob',
      });
      return response.data;
    },
  });
}

export function usePlanningCalculate() {
  return useMutation({
    mutationFn: async (state: any) => {
      const response = await api.post('/api/planning/calculate', state);
      return response.data;
    },
  });
}
