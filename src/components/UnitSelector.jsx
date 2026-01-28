import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from 'lucide-react';

export default function UnitSelector({ value, onChange, teamMember }) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnits();
  }, [teamMember]);

  const loadUnits = async () => {
    if (!teamMember) return;
    
    try {
      const unitsData = await base44.entities.Unit.filter({ 
        organization_id: teamMember.organization_id 
      });
      setUnits(unitsData);
      
      // Auto-select first unit if none selected
      if (unitsData.length > 0 && !value) {
        onChange(unitsData[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg animate-pulse">
        <Building2 className="w-4 h-4 text-slate-400" />
        <div className="h-4 w-32 bg-slate-300 rounded" />
      </div>
    );
  }

  if (units.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-slate-500" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px] h-9">
          <SelectValue placeholder="Selecione a unidade" />
        </SelectTrigger>
        <SelectContent>
          {units.map(unit => (
            <SelectItem key={unit.id} value={unit.id}>
              {unit.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}