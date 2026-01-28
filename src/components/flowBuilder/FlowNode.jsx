import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, GripVertical, MessageCircle, GitBranch, Zap, CheckCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

// Add missing import for the component
const MessageCircleIcon = MessageCircle;

const nodeIcons = {
  greeting: MessageCircle,
  question: MessageCircle,
  condition: GitBranch,
  action: Zap,
  end: CheckCircle
};

export default function FlowNode({ node, onDelete, onEdit, isDragging }) {
  const Icon = nodeIcons[node.type] || MessageCircle;
  
  const typeLabels = {
    greeting: 'Saudação',
    question: 'Pergunta',
    condition: 'Condição',
    action: 'Ação',
    end: 'Fim'
  };

  return (
    <Card className={cn(
      "p-3 min-w-max bg-white border-2",
      isDragging ? "opacity-50" : "opacity-100",
      node.type === 'greeting' && "border-blue-300 bg-blue-50",
      node.type === 'question' && "border-purple-300 bg-purple-50",
      node.type === 'condition' && "border-orange-300 bg-orange-50",
      node.type === 'action' && "border-green-300 bg-green-50",
      node.type === 'end' && "border-gray-300 bg-gray-50"
    )}>
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-slate-400 cursor-grab active:cursor-grabbing" />
        <Icon className="w-4 h-4" />
        <div className="flex flex-col">
          <p className="text-xs font-semibold text-slate-700">{typeLabels[node.type]}</p>
          <p className="text-xs text-slate-600 truncate max-w-[150px]">{node.label || 'Sem título'}</p>
        </div>
        <div className="flex gap-1 ml-2">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(node)}>
            <span className="text-xs">✎</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700" onClick={() => onDelete(node.id)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}