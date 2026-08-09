import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { kriptoAuth } from '@/lib/kriptoAuth';
const isDev = import.meta.env.DEV;
const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
const base44Sdk = createClient({
  appId,
  token,
  functionsVersion,
  
  requiresAuth: false,
  ...(isDev && appBaseUrl ? { serverUrl: appBaseUrl, appBaseUrl } : {})
});

// Keep existing data/integration calls on the Base44 SDK while routing every
// authentication call through KriptoAman's first-party /api/auth endpoints.
export const base44 = new Proxy(base44Sdk, {
  get(target, property) {
    if (property === 'auth') return kriptoAuth;
    return Reflect.get(target, property, target);
  },
});
