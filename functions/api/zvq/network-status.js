import { onRequestGet as legacyNetworkStatus } from '../kam/network-status.js';

export async function onRequestGet(context) {
  return legacyNetworkStatus(context);
}
