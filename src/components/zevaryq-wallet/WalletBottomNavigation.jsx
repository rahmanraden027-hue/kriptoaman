import { BarChart3, Compass, Settings, ShieldCheck, WalletCards } from 'lucide-react';
const ITEMS = [{id:'wallet',label:'Wallet',Icon:WalletCards},{id:'explorer',label:'Explorer',Icon:Compass},{id:'markets',label:'Markets',Icon:BarChart3},{id:'security',label:'Security',Icon:ShieldCheck},{id:'settings',label:'Settings',Icon:Settings}];
export default function WalletBottomNavigation({ active, onChange }) {
  return <nav className="zv-bottom-nav" aria-label="Wallet navigation"><div className="mx-auto flex max-w-xl">{ITEMS.map(({id,label,Icon}) => <button key={id} type="button" aria-current={active === id ? 'page' : undefined} onClick={() => onChange(id)} className={`flex min-h-[62px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold ${active === id ? 'text-[#F2C86B]' : 'text-[#6F859B]'}`}><Icon className={`h-5 w-5 ${active === id ? 'drop-shadow-[0_0_8px_rgba(45,140,255,.8)]' : ''}`} />{label}</button>)}</div></nav>;
}
