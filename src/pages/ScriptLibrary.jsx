import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import ScriptLibraryFilters from '@/components/scriptLibrary/ScriptLibraryFilters';
import ScriptCard from '@/components/scriptLibrary/ScriptCard';
import ScriptDetailModal from '@/components/scriptLibrary/ScriptDetailModal';
import ScriptAssignmentModal from '@/components/scriptLibrary/ScriptAssignmentModal';
import ScriptActionsModal from '@/components/scriptLibrary/ScriptActionsModal';
import NewScriptModal from '@/components/scriptLibrary/NewScriptModal';

export default function ScriptLibrary() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    channel: '',
    usageType: '',
    status: '',
    approved: undefined
  });
  const [selectedScript, setSelectedScript] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignScript, setAssignScript] = useState(null);
  const [approving, setApproving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [newScriptModalOpen, setNewScriptModalOpen] = useState(false);
  const [actionsModalOpen, setActionsModalOpen] = useState(false);
  const [actionsModalScript, setActionsModalScript] = useState(null);
  const [actionsModalAction, setActionsModalAction] = useState(null);

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.AIScript.list('-updated_date', 200);
      setScripts(data || []);
    } catch (error) {
      console.error('Erro ao carregar scripts:', error);
      toast.error('Erro ao carregar scripts');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const filteredScripts = scripts.filter(script => {
    if (filters.search && !script.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.channel && script.channel !== filters.channel) {
      return false;
    }
    if (filters.usageType && script.usage_type !== filters.usageType) {
      return false;
    }
    if (filters.status && script.status !== filters.status) {
      return false;
    }
    if (filters.approved !== undefined && script.is_approved !== filters.approved) {
      return false;
    }
    return true;
  });

  const handleViewDetails = (script) => {
    setSelectedScript(script);
    setDetailModalOpen(true);
  };

  const handleApproveScript = async (script) => {
    setApproving(true);
    try {
      await base44.asServiceRole.entities.AIScript.update(script.id, {
        status: 'approved',
        is_approved: true,
        approved_by: (await base44.auth.me()).email,
        approved_at: new Date().toISOString()
      });

      await loadScripts();
      setDetailModalOpen(false);
      toast.success('Script aprovado com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao aprovar script');
    } finally {
      setApproving(false);
    }
  };

  const handleAssignScript = async (script, assistantId) => {
    setAssigning(true);
    try {
      await base44.asServiceRole.entities.Assistant.update(assistantId, {
        approved_script_id: script.id
      });

      await loadScripts();
      setAssignModalOpen(false);
      toast.success('Script vinculado ao assistente!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao vincular script');
    } finally {
      setAssigning(false);
    }
  };

  const handleOpenAssignModal = (script) => {
    setAssignScript(script);
    setAssignModalOpen(true);
  };

  const openActionsModal = (script, action) => {
    setActionsModalScript(script);
    setActionsModalAction(action);
    setActionsModalOpen(true);
  };

  const stats = {
    total: scripts.length,
    approved: scripts.filter(s => s.is_approved).length,
    draft: scripts.filter(s => s.status === 'draft').length,
    review: scripts.filter(s => s.status === 'testing').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            Biblioteca de Scripts
          </h1>
          <p className="text-slate-600 mt-2">Repositório central de inteligência do CLINIQ.AI</p>
        </div>
        <Button
          onClick={() => setNewScriptModalOpen(true)}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Novo Script
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Total</p>
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Rascunho</p>
            <p className="text-3xl font-bold text-slate-600">{stats.draft}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Em Revisão</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.review}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-1">Aprovados</p>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <ScriptLibraryFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Scripts List */}
      {filteredScripts.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg font-medium mb-2">Nenhum script encontrado</p>
            <p className="text-slate-500 text-sm mb-6">
              {scripts.length === 0
                ? 'Comece criando seu primeiro script através da Simulação & Treinamento'
                : 'Ajuste os filtros para encontrar o script desejado'}
            </p>
            <Button
              onClick={() => window.location.href = createPageUrl('SimulationTraining')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Ir para Simulação & Treinamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredScripts.map(script => (
            <ScriptCard
              key={script.id}
              script={script}
              onView={handleViewDetails}
              onApprove={handleApproveScript}
              onAssign={handleOpenAssignModal}
              onClone={(s) => openActionsModal(s, 'clone')}
              onVersion={(s) => openActionsModal(s, 'version')}
              onSubmit={(s) => openActionsModal(s, 'submit')}
              onReject={(s) => openActionsModal(s, 'reject')}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ScriptDetailModal
        script={selectedScript}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onApprove={handleApproveScript}
        approving={approving}
      />

      <ScriptAssignmentModal
        script={assignScript}
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        onAssign={handleAssignScript}
        assigning={assigning}
      />

      <NewScriptModal
        open={newScriptModalOpen}
        onOpenChange={setNewScriptModalOpen}
        onScriptCreated={loadScripts}
      />

      <ScriptActionsModal
        script={actionsModalScript}
        action={actionsModalAction}
        open={actionsModalOpen}
        onOpenChange={setActionsModalOpen}
        onSuccess={loadScripts}
      />
    </div>
  );
}