import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function InstagramCard() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    toast.info('Conectar Instagram: Em desenvolvimento');
    setLoading(false);
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6" style={{ color: '#E4405F' }} />
            <div>
              <CardTitle className="text-lg">Instagram</CardTitle>
              <p className="text-xs text-slate-500">Direct + Comentários</p>
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
              <p className="mt-1">Conecte via login Facebook para acessar Direct e comentários do Instagram</p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleConnect}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          Conectar Instagram
        </Button>
      </CardContent>
    </Card>
  );
}