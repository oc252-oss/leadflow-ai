import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { DragDropContext } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Filter } from 'lucide-react';
import PipelineColumn from '@/components/pipeline/PipelineColumn';

const STAGES = [
  'new',
  'contacted', 
  'qualified',
  'scheduled',
  'proposal',
  'closed_won',
  'closed_lost'
];

export default function Pipeline() {
  const [leads, setLeads] = useState([]);
  const [teamMember, setTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        setTeamMember(members[0]);
        const companyId = members[0].company_id;
        const leadsData = await base44.entities.Lead.filter({ company_id: companyId }, '-created_date');
        setLeads(leadsData);
      }
    } catch (error) {
      console.error('Error loading pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStage = destination.droppableId;
    const lead = leads.find(l => l.id === draggableId);
    
    if (!lead || lead.funnel_stage === newStage) return;

    // Optimistic update
    setLeads(leads.map(l => 
      l.id === draggableId ? { ...l, funnel_stage: newStage } : l
    ));

    try {
      const user = await base44.auth.me();
      await base44.entities.Lead.update(draggableId, { funnel_stage: newStage });
      
      await base44.entities.ActivityLog.create({
        company_id: teamMember.company_id,
        lead_id: draggableId,
        user_email: user.email,
        action: 'stage_changed',
        old_value: lead.funnel_stage,
        new_value: newStage,
        details: { lead_name: lead.name }
      });
    } catch (error) {
      console.error('Error updating lead stage:', error);
      // Revert on error
      setLeads(leads);
    }
  };

  const getLeadsByStage = (stage) => {
    return leads.filter(l => l.funnel_stage === stage);
  };

  const stats = {
    total: leads.length,
    hot: leads.filter(l => l.temperature === 'hot').length,
    conversion: leads.length > 0 
      ? ((leads.filter(l => l.funnel_stage === 'closed_won').length / leads.length) * 100).toFixed(1)
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sales Pipeline</h2>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary">{stats.total} leads</Badge>
            <Badge className="bg-orange-100 text-orange-700">{stats.hot} hot</Badge>
            <Badge className="bg-emerald-100 text-emerald-700">{stats.conversion}% conversion</Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 min-w-max">
            {STAGES.map((stage) => (
              <PipelineColumn
                key={stage}
                stage={stage}
                leads={getLeadsByStage(stage)}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}