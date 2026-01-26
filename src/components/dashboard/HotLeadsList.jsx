import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, ArrowRight, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { t } from '@/components/i18n';

export default function HotLeadsList({ leads = [] }) {
  const hotLeads = leads.filter(l => l.temperature === 'hot').slice(0, 5);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          {t('hot_leads')}
        </CardTitle>
        <Link to={createPageUrl('Leads') + '?temperature=hot'}>
          <Button variant="ghost" size="sm" className="text-indigo-600">
            {t('view_all')} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {hotLeads.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Flame className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p>{t('no_hot_leads')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hotLeads.map((lead) => (
              <Link 
                key={lead.id}
                to={createPageUrl('LeadDetail') + `?id=${lead.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-medium">
                    {lead.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {lead.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(lead.created_date), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                    {t('score')}: {lead.score}
                  </Badge>
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}