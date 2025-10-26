import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';

/**
 * Optimized query hooks with best practices built-in
 */

interface OptimizedQueryOptions<TData, TError = Error> extends 
  Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  refetchOnFocus?: boolean;
  enableRetry?: boolean;
  cacheTime?: number;
  staleTime?: number;
}

export function useOptimizedQuery<TData, TError = Error>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options: OptimizedQueryOptions<TData, TError> = {}
) {
  const {
    refetchOnFocus = false,
    enableRetry = false,
    cacheTime = 5 * 60 * 1000,
    staleTime = 1 * 60 * 1000,
    ...restOptions
  } = options;

  return useQuery({
    queryKey,
    queryFn,
    refetchOnWindowFocus: refetchOnFocus,
    retry: enableRetry,
    gcTime: cacheTime,
    staleTime,
    ...restOptions
  });
}

/**
 * Optimistic mutation with automatic rollback
 */
export function useOptimisticMutation<TData, TVariables, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    queryKey: unknown[];
    updateFn: (oldData: TData | undefined, variables: TVariables) => TData;
    onSuccess?: (data: TData) => void;
    onError?: (error: TError) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previousData = queryClient.getQueryData<TData>(options.queryKey);
      queryClient.setQueryData<TData>(
        options.queryKey,
        (old) => options.updateFn(old, variables)
      );
      return { previousData };
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(options.queryKey, context.previousData);
      }
      options.onError?.(error as TError);
    },
    onSuccess: (data) => {
      options.onSuccess?.(data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey });
    }
  });
}
