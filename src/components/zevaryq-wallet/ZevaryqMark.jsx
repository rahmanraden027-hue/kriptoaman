import { ZEVARYQ_APP_ICON, ZVQ_TOKEN_ICON } from '@/lib/zevaryqBrandAssets';

export default function ZevaryqMark({ className = 'h-12 w-12', variant = 'app' }) {
  const isToken = variant === 'token';
  const src = isToken ? ZVQ_TOKEN_ICON : ZEVARYQ_APP_ICON;
  const alt = isToken ? 'ZVQ' : 'ZEVARYQ';
  const rounded = isToken ? 'rounded-full' : 'rounded-[24%]';

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${rounded} object-contain drop-shadow-[0_0_18px_rgba(217,164,65,.32)]`}
      data-zevaryq-mark={isToken ? 'zvq-token-final-v1' : 'zevaryq-app-final-v1'}
    />
  );
}
