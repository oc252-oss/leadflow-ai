import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Lock } from 'lucide-react';
import { PLAN_LABELS, getRequiredPlan } from '@/utils/featureGates';

export default function UpgradeCTA({ feature, message, inline = false, currentPlan }) {
  const requiredPlan = getRequiredPlan(feature);
  
  if (inline) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Lock className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900">{message}</p>
          <p className="text-xs text-slate-600 mt-0.5">
            Disponível no plano {PLAN_LABELS[requiredPlan]}
          </p>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0">
          Upgrade
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50/30">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-indigo-600">
            {PLAN_LABELS[requiredPlan]}
          </Badge>
        </div>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          {message || 'Desbloqueie este recurso'}
        </CardTitle>
        <CardDescription>
          Este recurso está disponível para clientes do plano {PLAN_LABELS[requiredPlan]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
          Fazer Upgrade
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}