import { toNextJsHandler } from 'better-auth/next-js';

import { auth } from '@/lib/auth';

// Better Auth needs the Node runtime (crypto + pg), not edge.
export const runtime = 'nodejs';

export const { GET, POST } = toNextJsHandler(auth);
