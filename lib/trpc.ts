import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/routers';
import superjson from 'superjson';

// Créer le client tRPC
export const trpc = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: '/api/trpc',
      // Ajouter les credentials pour les cookies de session
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        });
      },
    }),
  ],
});

// Type helper pour extraire les types du router
export type RouterInput = Parameters<AppRouter['_def']['procedures'][keyof AppRouter['_def']['procedures']]['query' | 'mutate']>[0];
export type RouterOutput = Awaited<ReturnType<AppRouter['_def']['procedures'][keyof AppRouter['_def']['procedures']]['query' | 'mutate']>>;
