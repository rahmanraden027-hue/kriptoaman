import ExternalWalletConnections from './ExternalWalletConnections';

/**
 * Backward-compatible entry point.
 * The previous implementation generated synthetic addresses, balances and QR data.
 * It is intentionally replaced by real injected EVM and Phantom providers.
 */
export default function WalletConnectPanel() {
  return <ExternalWalletConnections />;
}
