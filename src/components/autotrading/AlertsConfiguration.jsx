import React, { useState } from 'react';
import { Bell, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function AlertsConfiguration({ strategy, onAlertsChange }) {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'drawdown',
      label: 'Drawdown Threshold',
      value: 5,
      unit: '%',
      enabled: true,
      description: 'Alert when drawdown exceeds this percentage'
    },
    {
      id: 2,
      type: 'plChange',
      label: 'P/L Change',
      value: 500,
      unit: '$',
      enabled: true,
      description: 'Alert when daily P/L changes by this amount'
    },
    {
      id: 3,
      type: 'winRate',
      label: 'Win Rate Drop',
      value: 40,
      unit: '%',
      enabled: false,
      description: 'Alert if win rate drops below this percentage'
    }
  ]);

  const [showAddAlert, setShowAddAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: 'maxLoss',
    value: '',
    unit: '%'
  });

  const handleToggleAlert = (id) => {
    const updated = alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    setAlerts(updated);
    onAlertsChange(updated);
  };

  const handleUpdateAlert = (id, newValue) => {
    const updated = alerts.map(a => a.id === id ? { ...a, value: newValue } : a);
    setAlerts(updated);
    onAlertsChange(updated);
  };

  const handleRemoveAlert = (id) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    onAlertsChange(updated);
  };

  const handleAddAlert = () => {
    if (!newAlert.value) return;
    
    const alertTypes = {
      maxLoss: { label: 'Max Loss', desc: 'Alert on maximum loss threshold' },
      consecLosses: { label: 'Consecutive Losses', desc: 'Alert on consecutive losing trades' },
      volatility: { label: 'Volatility Spike', desc: 'Alert on high volatility' }
    };

    const typeInfo = alertTypes[newAlert.type];
    const id = Math.max(...alerts.map(a => a.id), 0) + 1;

    const alertToAdd = {
      id,
      type: newAlert.type,
      label: typeInfo.label,
      value: parseFloat(newAlert.value),
      unit: newAlert.unit,
      enabled: true,
      description: typeInfo.desc
    };

    const updated = [...alerts, alertToAdd];
    setAlerts(updated);
    onAlertsChange(updated);
    setNewAlert({ type: 'maxLoss', value: '', unit: '%' });
    setShowAddAlert(false);
  };

  return (
    <Card className="bg-slate-800/60 border-slate-700/40 p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Performance Alerts
          </h4>
          <Button
            onClick={() => setShowAddAlert(!showAddAlert)}
            variant="ghost"
            size="sm"
            className="h-6 px-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Add New Alert */}
        {showAddAlert && (
          <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40 space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-2">Alert Type</label>
              <select
                value={newAlert.type}
                onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded text-xs text-white p-2"
              >
                <option value="maxLoss">Max Loss Threshold</option>
                <option value="consecLosses">Consecutive Losses</option>
                <option value="volatility">Volatility Spike</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-2">Value</label>
                <Input
                  type="number"
                  value={newAlert.value}
                  onChange={(e) => setNewAlert({ ...newAlert, value: e.target.value })}
                  placeholder="Enter value"
                  className="bg-slate-800 border-slate-700 text-white text-xs h-8"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Unit</label>
                <select
                  value={newAlert.unit}
                  onChange={(e) => setNewAlert({ ...newAlert, unit: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded text-xs text-white p-2"
                >
                  <option value="%">%</option>
                  <option value="$">$</option>
                  <option value="#">Count</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddAlert}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700 h-8"
              >
                Add Alert
              </Button>
              <Button
                onClick={() => setShowAddAlert(false)}
                variant="outline"
                size="sm"
                className="flex-1 h-8"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Alert List */}
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`border rounded-lg p-3 transition ${
                alert.enabled
                  ? 'bg-slate-900/40 border-slate-700/40'
                  : 'bg-slate-900/20 border-slate-800/40 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alert.enabled}
                        onChange={() => handleToggleAlert(alert.id)}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 cursor-pointer"
                      />
                      <p className="text-xs font-semibold text-slate-300">{alert.label}</p>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 ml-6">{alert.description}</p>
                </div>
                <Button
                  onClick={() => handleRemoveAlert(alert.id)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {alert.enabled && (
                <div className="ml-6 mt-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Threshold:</label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={alert.value}
                        onChange={(e) => handleUpdateAlert(alert.id, parseFloat(e.target.value))}
                        className="w-16 bg-slate-800 border-slate-700 text-white text-xs h-7"
                      />
                      <span className="text-xs text-slate-400">{alert.unit}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
          <p className="text-xs text-blue-300">
            💡 Active alerts: <span className="font-semibold">{alerts.filter(a => a.enabled).length}</span> 
            • You'll receive notifications when thresholds are breached
          </p>
        </div>
      </div>
    </Card>
  );
}