import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Facebook, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function FacebookCard() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    toast.info('Conectar Facebook: Em desenvolvimento');
    setLoading(false);
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Facebook className="w-6 h-6 text-blue-600" />
            <div>
              <CardTitle className="text-lg">Facebook</CardTitle>
              <p className="text-xs text-slate-500">Pages + Messenger</p>
            </div>
          </div>
          <Badge className="bg-slate-100 text-slate-800">
            ⊘ Desconectado
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-slate-500 mt-0.5" />
            <div className="text-xs text-slate-600">
              <p className="font-medium">OAuth Facebook Business</p>
              <p className="mt-1">Conecte suas páginas do Facebook para gerenciar mensagens e comentários</p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleConnect}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          Conectar Facebook
        </Button>
      </CardContent>
    </Card>
  );
}