import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Save, Loader2, MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ChartTemplateManager({ onApply }) {
  const [isSaving, setIsSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['chartTemplates'],
    queryFn: () => base44.entities.ChartTemplate.list(),
  });

  const saveTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.ChartTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chartTemplates'] });
      setIsSaving(false);
      setTemplateName('');
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.ChartTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chartTemplates'] });
    },
  });

  const handleSaveTemplate = () => {
    if (templateName.trim()) {
      saveTemplateMutation.mutate({
        name: templateName,
        indicators: [],
        chartType: 'line',
        timeframe: '1h',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {templates.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              Load Template
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
            {templates.map(template => (
              <div key={template.id} className="flex items-center justify-between px-2 py-1 hover:bg-slate-700">
                <DropdownMenuItem
                  onClick={() => onApply?.(template)}
                  className="cursor-pointer flex-1"
                >
                  {template.name}
                </DropdownMenuItem>
                <button
                  onClick={() => deleteTemplateMutation.mutate(template.id)}
                  className="text-slate-400 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {!isSaving ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsSaving(true)}
          className="gap-2"
        >
          <Save className="w-4 h-4" /> Save
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Template name..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="h-8 px-2 rounded bg-slate-700 border border-slate-600 text-white text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleSaveTemplate()}
          />
          <Button
            size="sm"
            onClick={handleSaveTemplate}
            disabled={saveTemplateMutation.isPending}
            className="gap-2"
          >
            {saveTemplateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSaving(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}