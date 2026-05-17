import { QueryClient } from '@tanstack/react-query'

/** Shared QueryClient — also imported by Zustand stores that read the query cache. */
export const queryClient = new QueryClient()
