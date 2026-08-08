import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
const isDev = import.meta.env.DEV;
const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  
  requiresAuth: false,
  ...(isDev && appBaseUrl ? { serverUrl: appBaseUrl, appBaseUrl } : {})
});
