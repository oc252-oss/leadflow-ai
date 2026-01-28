import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, MessageCircle, GitBranch, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";

const nodeIcons = {
  greeting: MessageCircle,
  question: MessageCircle,
  condition: GitBranch,
  action: Zap,
  end: CheckCircle
};

export default function FlowPreview({ nodes }) {
  const [showPreview, setShowPreview] = useState(false);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);

  if (nodes.length === 0) {
    return (
      <Button variant="outline" disabled>
        <Eye className="w-4 h-4 mr-2" />
        Visualizar (vazio)
      </Button>
    );
  }

  const currentNode = nodes[currentNodeIndex];
  const Icon = nodeIcons[currentNode.type] || MessageCircle;

  const handleNext = () => {
    if (currentNode.next_step) {
      const nextIndex = nodes.findIndex(n => n.id === currentNode.next_step);
      if (nextIndex !== -1) {
        setCurrentNodeIndex(nextIndex);
        return;
      }
    }
    if (currentNodeIndex < nodes.length - 1) {
      setCurrentNodeIndex(currentNodeIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentNodeIndex > 0) {
      setCurrentNodeIndex(currentNodeIndex - 1);
    }
  };

  const calculateFlowStats = () => {
    const connected = nodes.filter(n => n.next_step).length;
    const unconnected = nodes.filter(n => !n.next_step && n.type !== 'end').length;
    return { connected, unconnected, total: nodes.length };
  };

  const stats = calculateFlowStats();

  return (
    <>
      <Button onClick={() => setShowPreview(true)} variant="outline">
        <Eye className="w-4 h-4 mr-2" />
        Visualizar Fluxo ({stats.total} nós)
      </Button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Prévia do Fluxo</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Flow Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-slate-600">Total de Nós</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-slate-600">Conectados</p>
                    <p className="text-2xl font-bold text-green-600">{stats.connected}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-slate-600">Desconectados</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.unconnected}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Node Preview */}
            <Card className="border-2 border-indigo-300 bg-indigo-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Icon className="w-8 h-8 text-indigo-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <Badge className="mb-2" variant="outline">
                      Nó {currentNodeIndex + 1} de {nodes.length}
                    </Badge>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {currentNode.label || 'Sem título'}
                    </h3>
                    {currentNode.question && (
                      <p className="text-sm text-slate-700 mb-3">
                        {currentNode.question}
                      </p>
                    )}
                    {currentNode.next_step && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                        <ArrowRight className="w-3 h-3" />
                        <span>
                          Conectado a: <strong>
                            {nodes.find(n => n.id === currentNode.next_step)?.label || 'desconectado'}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center gap-2">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentNodeIndex === 0}
              >
                ← Anterior
              </Button>

              <div className="text-sm text-slate-600 text-center flex-1">
                <p>Nó {currentNodeIndex + 1} de {nodes.length}</p>
                <div className="w-full bg-slate-200 rounded-full h-1 mt-2">
                  <div
                    className="bg-indigo-600 h-1 rounded-full transition-all"
                    style={{ width: `${((currentNodeIndex + 1) / nodes.length) * 100}%` }}
                  />
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentNodeIndex === nodes.length - 1}
              >
                Próximo →
              </Button>
            </div>

            {/* Fluxo Completo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Estrutura Completa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {nodes.map((node, idx) => (
                    <div
                      key={node.id}
                      onClick={() => setCurrentNodeIndex(idx)}
                      className={cn(
                        "p-2 rounded cursor-pointer transition-colors text-xs",
                        currentNodeIndex === idx
                          ? "bg-indigo-100 border border-indigo-300"
                          : "bg-slate-50 hover:bg-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500">{idx + 1}.</span>
                        <span className="font-medium text-slate-900 flex-1">
                          {node.label || 'Sem título'}
                        </span>
                        {node.next_step ? (
                          <ArrowRight className="w-3 h-3 text-green-600" />
                        ) : (
                          <span className="text-xs text-orange-600">✗</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}