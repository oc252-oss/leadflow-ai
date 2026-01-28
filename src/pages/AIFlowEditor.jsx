import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import FlowBuilder from '@/components/flowBuilder/FlowBuilder';
import { toast } from 'sonner';

const getFlowIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('flowId');
};

export default function AIFlowEditor() {
  const navigate = useNavigate();
  const flowId = getFlowIdFromUrl();
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(!!flowId);

  useEffect(() => {
    if (flowId) {
      loadFlow();
    }
  }, [flowId]);

  const loadFlow = async () => {
    try {
      const data = await base44.entities.AIFlow.get(flowId);
      setFlow(data);
    } catch (error) {
      console.error('Error loading flow:', error);
      toast.error('Erro ao carregar fluxo');
      navigate('/AIFlows');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFlow = async (nodes) => {
    try {
      const flowData = {
        ...flow,
        questions: nodes
      };

      if (flowId) {
        await base44.entities.AIFlow.update(flowId, flowData);
        toast.success('Fluxo atualizado com sucesso');
      } else {
        await base44.entities.AIFlow.create(flowData);
        toast.success('Fluxo criado com sucesso');
      }

      navigate('/AIFlows');
    } catch (error) {
      console.error('Error saving flow:', error);
      toast.error('Erro ao salvar fluxo');
    }
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
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate('/AIFlows')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {flowId ? 'Editar Fluxo' : 'Novo Fluxo'}
          </h1>
          {flow && <p className="text-slate-500 mt-1">{flow.name}</p>}
        </div>
      </div>

      {/* Editor */}
      <FlowBuilder 
        flow={flow || { questions: [] }}
        onSave={handleSaveFlow}
      />
    </div>
  );
}