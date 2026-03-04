import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { DollarSign, Calendar, Percent } from 'lucide-react';

const ASSETS = ['USDT', 'BTC', 'ETH', 'SOL', 'BNB'];

export default function LoanRequestForm({ onSubmit, loading = false }) {
  const [formData, setFormData] = useState({
    asset: 'USDT',
    amount: '',
    interestRate: '',
    durationDays: '',
    notes: ''
  });

  const handleSubmit = () => {
    if (formData.amount && formData.interestRate && formData.durationDays) {
      onSubmit(formData);
      setFormData({ asset: 'USDT', amount: '', interestRate: '', durationDays: '', notes: '' });
    }
  };

  return (
    <Card className="bg-slate-800/60 border-slate-700/40 p-5">
      <h3 className="text-white font-semibold mb-4">Buat Permintaan Pinjaman</h3>
      
      <div className="space-y-4">
        {/* Asset */}
        <div>
          <label className="text-slate-400 text-xs font-semibold block mb-2">Aset</label>
          <Select value={formData.asset} onValueChange={(val) => setFormData({...formData, asset: val})}>
            <SelectTrigger className="bg-slate-900 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSETS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Amount */}
        <div>
          <label className="text-slate-400 text-xs font-semibold block mb-2 flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Jumlah
          </label>
          <Input
            type="number"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            className="bg-slate-900 border-slate-700 text-white"
          />
        </div>

        {/* Interest Rate */}
        <div>
          <label className="text-slate-400 text-xs font-semibold block mb-2 flex items-center gap-1">
            <Percent className="w-3 h-3" /> Bunga (% per tahun)
          </label>
          <Input
            type="number"
            placeholder="5"
            value={formData.interestRate}
            onChange={(e) => setFormData({...formData, interestRate: e.target.value})}
            className="bg-slate-900 border-slate-700 text-white"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="text-slate-400 text-xs font-semibold block mb-2 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Durasi (hari)
          </label>
          <Input
            type="number"
            placeholder="30"
            value={formData.durationDays}
            onChange={(e) => setFormData({...formData, durationDays: e.target.value})}
            className="bg-slate-900 border-slate-700 text-white"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-slate-400 text-xs font-semibold block mb-2">Catatan (optional)</label>
          <textarea
            placeholder="Jelaskan kebutuhan pinjaman Anda..."
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white text-sm p-2 resize-none"
            rows="3"
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!formData.amount || !formData.interestRate || !formData.durationDays || loading}
          className="w-full bg-cyan-600 hover:bg-cyan-700"
        >
          {loading ? 'Membuat...' : 'Buat Permintaan'}
        </Button>
      </div>
    </Card>
  );
}