import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Target,
  Flame,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import StatsCard from '@/components/dashboard/StatsCard';
import LeadSourceChart from '@/components/dashboard/LeadSourceChart';
import ConversionChart from '@/components/dashboard/ConversionChart';
import HotLeadsList from '@/components/dashboard/HotLeadsList';
import RecentActivity from '@/components/dashboard/RecentActivity';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeadsToday: 0,
    hotLeads: 0,
    conversions: 0,
    conversionRate: 0,
    avgResponseTime: 0
  });
  const [leads, setLeads] = useState([]);
  const [activities, setActivities] = useState([]);
  const [teamMember, setTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        setTeamMember(members[0]);
        const companyId = members[0].company_id;

        // Load leads
        const allLeads = await base44.entities.Lead.filter({ company_id: companyId }, '-created_date', 100);
        setLeads(allLeads);

        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const newToday = allLeads.filter(l => new Date(l.created_date) >= today).length;
        const hotLeads = allLeads.filter(l => l.temperature === 'hot').length;
        const conversions = allLeads.filter(l => l.funnel_stage === 'closed_won').length;
        const conversionRate = allLeads.length > 0 ? ((conversions / allLeads.length) * 100).toFixed(1) : 0;

        setStats({
          totalLeads: allLeads.length,
          newLeadsToday: newToday,
          hotLeads: hotLeads,
          conversions: conversions,
          conversionRate: conversionRate,
          avgResponseTime: '2.5 min'
        });

        // Load activities
        const activityLogs = await base44.entities.ActivityLog.filter({ company_id: companyId }, '-created_date', 20);
        setActivities(activityLogs);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome back!</h2>
          <p className="text-slate-500 mt-1">Here's what's happening with your leads today.</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl('Leads')}>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Users className="w-4 h-4 mr-2" />
              View Leads
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Leads"
          value={stats.totalLeads}
          change="+12% from last week"
          changeType="positive"
          icon={Users}
          iconColor="bg-indigo-100 text-indigo-600"
        />
        <StatsCard
          title="New Today"
          value={stats.newLeadsToday}
          subtitle="leads captured"
          icon={Target}
          iconColor="bg-emerald-100 text-emerald-600"
        />
        <StatsCard
          title="Hot Leads"
          value={stats.hotLeads}
          subtitle="ready to convert"
          icon={Flame}
          iconColor="bg-orange-100 text-orange-600"
        />
        <StatsCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          change="+2.5% from last month"
          changeType="positive"
          icon={TrendingUp}
          iconColor="bg-violet-100 text-violet-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ConversionChart />
        </div>
        <LeadSourceChart />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HotLeadsList leads={leads} />
        <RecentActivity activities={activities} />
      </div>
    </div>
  );
}