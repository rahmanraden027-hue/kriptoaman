export const PRIMARY_NAV_ITEMS = Object.freeze([
  { id: 'home', page: 'Home', publicTo: '/', workspaceTo: '/dashboard' },
  { id: 'markets', page: 'Market', publicTo: '/Market', workspaceTo: '/Market' },
  { id: 'intelligence', page: 'IntelligenceHub', publicTo: '/IntelligenceHub', workspaceTo: '/IntelligenceHub' },
  { id: 'onchain', page: 'ZEVARYQ', publicTo: '/ZEVARYQ', workspaceTo: '/ZEVARYQ' },
  { id: 'ecosystem', page: 'Services', publicTo: '/Services', workspaceTo: '/Services' },
]);

export const PRIMARY_NAV_LABELS = Object.freeze({
  id: Object.freeze({
    home: 'Beranda',
    markets: 'Market',
    intelligence: 'Intelijen',
    onchain: 'Jaringan',
    ecosystem: 'Ekosistem',
  }),
  en: Object.freeze({
    home: 'Home',
    markets: 'Markets',
    intelligence: 'Intelligence',
    onchain: 'Network',
    ecosystem: 'Ecosystem',
  }),
});

export function primaryNavLabels(language) {
  return PRIMARY_NAV_LABELS[language] || PRIMARY_NAV_LABELS.id;
}

export function primaryNavTo(item, mode = 'public') {
  return mode === 'workspace' ? item.workspaceTo : item.publicTo;
}
