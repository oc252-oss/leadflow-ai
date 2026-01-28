import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Copy, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import FlowCanvas from './FlowCanvas';
import FlowPreview from './FlowPreview';
import AdvancedConditionBuilder from './AdvancedConditionBuilder';
import FlowSimulator from './FlowSimulator';

export default function FlowBuilder({ flow, onSave }) {
  const [nodes, setNodes] = useState(flow?.questions || []);
  const [conditions, setConditions] = useState(flow?.conditions || []);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [activeTab, setActiveTab] = useState('canvas');
  const [nodeForm, setNodeForm] = useState({
    type: 'question',
    label: '',
    content: '',
    nextYes: '',
    nextNo: ''
  });

  const handleAddNode = () => {
    setEditingNode(null);
    setNodeForm({ type: 'question', label: '', content: '', nextYes: '', nextNo: '' });
    setShowNodeDialog(true);
  };

  const handleEditNode = (node) => {
    setEditingNode(node);
    setNodeForm({
      type: node.type || 'question',
      label: node.label || '',
      content: node.question || '',
      nextYes: node.next_step || '',
      nextNo: ''
    });
    setShowNodeDialog(true);
  };

  const handleSaveNode = () => {
    if (!nodeForm.label.trim() || !nodeForm.content.trim()) {
      toast.error('Preencha título e conteúdo');
      return;
    }

    if (editingNode) {
      setNodes(nodes.map(n => n.id === editingNode.id ? {
        ...n,
        label: nodeForm.label,
        type: nodeForm.type,
        question: nodeForm.content,
        next_step: nodeForm.nextYes
      } : n));
      toast.success('Nó atualizado');
    } else {
      const newNode = {
        id: `node_${Date.now()}`,
        label: nodeForm.label,
        type: nodeForm.type,
        question: nodeForm.content,
        next_step: nodeForm.nextYes,
        score_impact: 0
      };
      setNodes([...nodes, newNode]);
      toast.success('Nó adicionado');
    }

    setShowNodeDialog(false);
  };

  const handleDeleteNode = (nodeId) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    toast.success('Nó removido');
  };

  const handleDuplicate = (node) => {
    const duplicated = {
      ...node,
      id: `node_${Date.now()}`,
      label: `${node.label} (cópia)`
    };
    setNodes([...nodes, duplicated]);
    toast.success('Nó duplicado');
  };

  const handleSaveFlow = () => {
    onSave({ nodes, conditions });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-slate-900">Editor Visual de Fluxo</h2>
        <div className="flex gap-2">
          <FlowPreview nodes={nodes} />
          <Button variant="outline" onClick={() => setShowSimulator(true)}>
            Testar Fluxo
          </Button>
          <Button onClick={handleAddNode} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Nó
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('canvas')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'canvas'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Canvas Interativo
        </button>
        <button
          onClick={() => setActiveTab('conditions')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'conditions'
              ? 'border-b-2 border-orange-600 text-orange-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Lógica Condicional
        </button>
      </div>

      {/* Canvas Tab */}
      {activeTab === 'canvas' && (
        <FlowCanvas
          nodes={nodes}
          onReorder={setNodes}
          onEdit={handleEditNode}
          onDelete={handleDeleteNode}
          onAddNode={handleAddNode}
        />
      )}

      {/* Conditions Tab */}
      {activeTab === 'conditions' && (
        <AdvancedConditionBuilder
          conditions={conditions}
          onChange={setConditions}
          availableNodes={nodes}
        />
      )}

      {/* Node Editor Dialog */}
      <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingNode ? 'Editar Nó' : 'Novo Nó'}</DialogTitle>
            <DialogDescription>Configure as propriedades do nó</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Nó</Label>
              <Select value={nodeForm.type} onValueChange={(value) => setNodeForm({ ...nodeForm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="greeting">Saudação</SelectItem>
                  <SelectItem value="question">Pergunta</SelectItem>
                  <SelectItem value="condition">Condição</SelectItem>
                  <SelectItem value="action">Ação</SelectItem>
                  <SelectItem value="end">Fim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Título/Label *</Label>
              <Input
                value={nodeForm.label}
                onChange={(e) => setNodeForm({ ...nodeForm, label: e.target.value })}
                placeholder="ex: Pergunta de Interesse"
              />
            </div>

            <div className="space-y-2">
              <Label>Conteúdo *</Label>
              <Textarea
                value={nodeForm.content}
                onChange={(e) => setNodeForm({ ...nodeForm, content: e.target.value })}
                placeholder={nodeForm.type === 'question' ? "ex: Qual é seu interesse?" : "Conteúdo da mensagem"}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Próximo Nó (ID)</Label>
              <Select value={nodeForm.nextYes} onValueChange={(value) => setNodeForm({ ...nodeForm, nextYes: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o próximo nó" />
                </SelectTrigger>
                <SelectContent>
                  {nodes.filter(n => n.id !== editingNode?.id).map(n => (
                    <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNodeDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveNode} className="bg-indigo-600 hover:bg-indigo-700">
              {editingNode ? 'Atualizar' : 'Adicionar'} Nó
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flow Simulator */}
      {showSimulator && (
        <FlowSimulator 
          nodes={nodes}
          onClose={() => setShowSimulator(false)}
        />
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-2 mt-8 pt-6 border-t border-slate-200">
        <Button variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
        <Button onClick={handleSaveFlow} className="bg-green-600 hover:bg-green-700">
          Salvar Fluxo
        </Button>
      </div>
    </div>
  );
}