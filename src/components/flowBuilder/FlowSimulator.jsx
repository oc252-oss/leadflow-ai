import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Send } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function FlowSimulator({ nodes, onClose }) {
  const [currentNodeId, setCurrentNodeId] = useState(nodes[0]?.id);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: nodes[0]?.question || nodes[0]?.label || 'Bem-vindo!'
    }
  ]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);

  const currentNode = nodes.find(n => n.id === currentNodeId);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: input }]);

    // Calculate impact
    const impact = currentNode?.score_impact || 0;
    setScore(prev => Math.min(100, Math.max(0, prev + impact)));

    // Move to next node
    if (currentNode?.next_step) {
      const nextNode = nodes.find(n => n.id === currentNode.next_step);
      if (nextNode) {
        setCurrentNodeId(nextNode.id);
        setMessages(prev => [...prev, {
          type: 'bot',
          text: nextNode.question || nextNode.label
        }]);
      }
    } else {
      setMessages(prev => [...prev, {
        type: 'bot',
        text: `Fim do fluxo. Pontuação final: ${score + impact}`
      }]);
    }

    setInput('');
  };

  const handleReset = () => {
    setCurrentNodeId(nodes[0]?.id);
    setMessages([
      {
        type: 'bot',
        text: nodes[0]?.question || nodes[0]?.label || 'Bem-vindo!'
      }
    ]);
    setScore(0);
  };

  const scoreColor = score > 75 ? 'bg-green-100 text-green-700' : score > 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[700px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Teste do Fluxo</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Score */}
          <div className={cn("p-3 rounded-lg text-center font-semibold", scoreColor)}>
            Pontuação: {score}/100
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-slate-50 rounded-lg">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn(
                "flex gap-2",
                msg.type === 'user' ? "justify-end" : "justify-start"
              )}>
                <div className={cn(
                  "max-w-xs rounded-lg p-3",
                  msg.type === 'user'
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-slate-200 text-slate-900"
                )}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Sua resposta..."
              className="text-sm"
            />
            <Button 
              onClick={handleSendMessage}
              size="icon"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Reset */}
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="w-full"
          >
            Reiniciar Teste
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}