import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Download, 
  Upload,
  LayoutGrid,
  List
} from 'lucide-react';
import LeadCard from '@/components/leads/LeadCard';
import LeadFilters from '@/components/leads/LeadFilters';
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";

export default function Leads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [teamMember, setTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    temperature: searchParams.get('temperature') || 'all',
    stage: 'all',
    source: 'all',
    campaign: 'all'
  });

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

        const [leadsData, campaignsData] = await Promise.all([
          base44.entities.Lead.filter({ company_id: companyId }, '-created_date'),
          base44.entities.Campaign.filter({ company_id: companyId })
        ]);

        setLeads(leadsData);
        setCampaigns(campaignsData);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async (leadData) => {
    const user = await base44.auth.me();
    const newLead = await base44.entities.Lead.create({
      ...leadData,
      company_id: teamMember.company_id,
      funnel_stage: 'Novo Lead',
      temperature: 'cold',
      score: 20
    });

    await base44.entities.ActivityLog.create({
      company_id: teamMember.company_id,
      lead_id: newLead.id,
      user_email: user.email,
      action: 'lead_created',
      details: { lead_name: leadData.name }
    });

    setLeads([newLead, ...leads]);
  };

  const handleOpenChat = async (lead) => {
    try {
      console.log('Opening chat for lead:', lead.id);

      // Call backend to create or get conversation
      const response = await base44.functions.invoke('createOrGetConversation', {
        lead_id: lead.id,
        company_id: teamMember.company_id,
        unit_id: teamMember.unit_id
      });

      if (response.data?.conversation) {
        console.log('Conversation ready:', response.data.conversation.id);
        // Navigate to Conversations page with conversation selected
        navigate(createPageUrl('Conversations') + `?conversation_id=${response.data.conversation.id}`);
      } else {
        console.error('No conversation in response:', response.data);
      }
    } catch (error) {
      console.error('Error opening chat:', error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !filters.search || 
      lead.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.phone?.includes(filters.search);
    
    const matchesTemp = filters.temperature === 'all' || lead.temperature === filters.temperature;
    const matchesStage = filters.stage === 'all' || lead.funnel_stage === filters.stage;
    const matchesSource = filters.source === 'all' || lead.source === filters.source;
    const matchesCampaign = filters.campaign === 'all' || lead.campaign_id === filters.campaign;

    return matchesSearch && matchesTemp && matchesStage && matchesSource && matchesCampaign;
  });

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
          <h2 className="text-2xl font-bold text-slate-900">Leads</h2>
          <p className="text-slate-500 mt-1">{filteredLeads.length} leads encontrados</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-slate-200 p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <LeadFilters filters={filters} setFilters={setFilters} campaigns={campaigns} />

      {/* Leads grid/list */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Plus className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum lead encontrado</h3>
          <p className="text-slate-500 mb-4">Tente ajustar os filtros ou adicione um novo lead</p>
          <Button onClick={() => setShowAddDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Lead
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onOpenChat={handleOpenChat} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} compact onOpenChat={handleOpenChat} />
          ))}
        </div>
      )}

      {/* Add Lead Dialog */}
      <AddLeadDialog 
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSave={handleAddLead}
        campaigns={campaigns}
      />
    </div>
  );
}