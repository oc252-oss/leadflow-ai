import React from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, Copy } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function VoiceCampaignsList({ campaigns, onEdit, onDelete, onDuplicate, onToggle, onAddNew, teamMembers }) {
  const getAssignmentLabel = (campaign) => {
    if (campaign.assigned_to_type === 'specific' && campaign.assigned_to_user_id) {
      const member = teamMembers.find(m => m.id === campaign.assigned_to_user_id);
      return member ? member.user_email : 'Deleted Member';
    }
    return 'Clinic Queue';
  };

  const getCriteriaLabel = (campaign) => {
    return `Leads inactive for ${campaign.inactivity_days} days`;
  };

  if (campaigns.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No voice campaigns yet</h3>
          <p className="text-slate-500 mb-4">Create your first voice campaign to start reengaging with inactive leads</p>
          <Button onClick={onAddNew} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Voice Campaign
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-700">Campaign Name</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">Type</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">Criteria</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">Assigned To</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
              <th className="text-right py-3 px-4 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className={cn(
                "border-b border-slate-100 hover:bg-slate-50 transition-colors",
                !campaign.is_active && "opacity-60"
              )}>
                <td className="py-3 px-4">
                  <p className="font-medium text-slate-900">{campaign.name}</p>
                </td>
                <td className="py-3 px-4">
                  <Badge variant="secondary">Reengagement</Badge>
                </td>
                <td className="py-3 px-4">
                  <span className="text-slate-600">{getCriteriaLabel(campaign)}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-slate-600">{getAssignmentLabel(campaign)}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      campaign.is_active ? "bg-green-500" : "bg-slate-300"
                    )} />
                    <Switch
                      checked={campaign.is_active}
                      onCheckedChange={() => onToggle(campaign)}
                    />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => onEdit(campaign)}
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => onDuplicate(campaign)}
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onDelete(campaign.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}