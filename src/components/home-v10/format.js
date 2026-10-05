export const finite = (value) => {
  const number = Number(value);
  return value !== null && value !== undefined && value !== '' && Number.isFinite(number)
    ? number
    : null;
};

export const formatPrice = (value) => {
  const number = finite(value);
  if (!Number.isFinite(number)) return '—';
  if (number >= 1000) return '$' + number.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (number >= 1) return '$' + number.toLocaleString('en-US', { maximumFractionDigits: 4 });
  return '$' + number.toLocaleString('en-US', { maximumSignificantDigits: 6 });
};

export const formatCompactUsd = (value) => {
  const number = finite(value);
  if (!Number.isFinite(number)) return '—';
  if (number >= 1e12) return '$' + (number / 1e12).toFixed(2) + 'T';
  if (number >= 1e9) return '$' + (number / 1e9).toFixed(2) + 'B';
  if (number >= 1e6) return '$' + (number / 1e6).toFixed(2) + 'M';
  if (number >= 1e3) return '$' + (number / 1e3).toFixed(1) + 'K';
  return '$' + number.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

export const formatChange = (value) => {
  const number = finite(value);
  if (!Number.isFinite(number)) return '—';
  return `${number >= 0 ? '+' : ''}${number.toFixed(2)}%`;
};

export const formatMagnitude = (value) => {
  const number = finite(value);
  return Number.isFinite(number) ? Math.abs(number).toFixed(2) + '%' : '—';
};

export const sparklinePoints = (values, width = 220, height = 72) => {
  const clean = Array.isArray(values)
    ? values.map(Number).filter(Number.isFinite).slice(-64)
    : [];
  if (clean.length < 2) return '';
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;
  return clean
    .map((value, index) => {
      const x = (index / (clean.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};
