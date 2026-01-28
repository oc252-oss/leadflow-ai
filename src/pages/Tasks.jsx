import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, User, Users, ArrowRight, Phone } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentTeamMember, setCurrentTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('my_tasks');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        setCurrentTeamMember(members[0]);
        const companyId = members[0].company_id;

        const [tasksData, leadsData, teamData] = await Promise.all([
          base44.entities.Task.filter({ company_id: companyId, status: 'open' }, '-created_date'),
          base44.entities.Lead.filter({ company_id: companyId }),
          base44.entities.TeamMember.filter({ company_id: companyId })
        ]);

        setTasks(tasksData);
        setLeads(leadsData);
        setTeamMembers(teamData);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (task) => {
    try {
      const user = await base44.auth.me();
      await base44.entities.Task.update(task.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: user.email
      });
      setTasks(tasks.filter(t => t.id !== task.id));
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleOpenLead = (leadId) => {
    navigate(createPageUrl('LeadDetail') + `?lead_id=${leadId}`);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'my_tasks') {
      return task.assigned_to_user_id === currentTeamMember?.id;
    } else if (filter === 'team_queue') {
      return !task.assigned_to_user_id;
    } else {
      return true;
    }
  });

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700',
    urgent: 'bg-red-100 text-red-700'
  };

  const typeIcons = {
    follow_up: Clock,
    evaluation: User,
    call_back: Phone,
    voice_campaign: Phone
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tarefas</h2>
          <p className="text-slate-500 mt-1">Gerencie follow-ups e ações pendentes</p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList>
          <TabsTrigger value="my_tasks" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Minhas Tarefas ({tasks.filter(t => t.assigned_to_user_id === currentTeamMember?.id).length})
          </TabsTrigger>
          <TabsTrigger value="team_queue" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Fila da Equipe ({tasks.filter(t => !t.assigned_to_user_id).length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todas ({tasks.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-3">
        {filteredTasks.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
              <p className="text-slate-500">Nenhuma tarefa pendente</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const lead = leads.find(l => l.id === task.lead_id);
            const TypeIcon = typeIcons[task.type] || Clock;
            const assignedMember = teamMembers.find(m => m.id === task.assigned_to_user_id);

            return (
              <Card key={task.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <TypeIcon className="w-4 h-4 text-slate-400" />
                        <h3 className="font-medium text-slate-900">{task.title}</h3>
                      </div>

                      {task.description && (
                        <p className="text-sm text-slate-600 mb-3 whitespace-pre-line">{task.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={priorityColors[task.priority]}>
                          {task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                        
                        {lead && (
                          <Badge variant="outline" className="cursor-pointer hover:bg-slate-50" onClick={() => handleOpenLead(lead.id)}>
                            {lead.name}
                          </Badge>
                        )}

                        {assignedMember ? (
                          <Badge variant="secondary" className="text-xs">
                            <User className="w-3 h-3 mr-1" />
                            {assignedMember.user_email}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            Fila da Equipe
                          </Badge>
                        )}

                        {task.due_date && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(new Date(task.due_date), 'dd/MM/yyyy')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleComplete(task)}
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Concluir
                      </Button>
                      {lead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenLead(lead.id)}
                        >
                          <ArrowRight className="w-4 h-4 mr-1" />
                          Ver Lead
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}