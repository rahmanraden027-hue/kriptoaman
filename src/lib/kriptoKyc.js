export async function startKyc() {
  const response = await fetch('/api/kyc/start', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Tidak dapat memulai verifikasi KYC');
  return data;
}
