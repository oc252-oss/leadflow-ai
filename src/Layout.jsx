import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { t } from '@/components/i18n';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Bell, 
  Menu, 
  X,
  ChevronDown,
  Building2,
  LogOut,
  Zap,
  Target,
  GitBranch,
  Facebook
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [teamMember, setTeamMember] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const teamMembers = await base44.entities.TeamMember.filter({ user_email: currentUser.email });
      if (teamMembers.length > 0) {
        setTeamMember(teamMembers[0]);
        const companies = await base44.entities.Company.filter({ id: teamMembers[0].company_id });
        if (companies.length > 0) {
          setCompany(companies[0]);
        }
      }

      const notifs = await base44.entities.Notification.filter({ 
        user_email: currentUser.email, 
        read: false 
      }, '-created_date', 10);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const publicPages = ['Login', 'Onboarding'];
  if (publicPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  const navigation = [
    { name: 'Dashboard', label: t('dashboard'), href: createPageUrl('Dashboard'), icon: LayoutDashboard, roles: ['company_admin', 'sales_manager', 'sales_agent'] },
    { name: 'Leads', label: t('leads'), href: createPageUrl('Leads'), icon: Users, roles: ['company_admin', 'sales_manager', 'sales_agent'] },
    { name: 'Pipeline', label: t('pipeline'), href: createPageUrl('Pipeline'), icon: GitBranch, roles: ['company_admin', 'sales_manager', 'sales_agent'] },
    { name: 'Conversations', label: t('conversations'), href: createPageUrl('Conversations'), icon: MessageSquare, roles: ['company_admin', 'sales_manager', 'sales_agent'] },
    { name: 'Campaigns', label: t('campaigns'), href: createPageUrl('Campaigns'), icon: Target, roles: ['company_admin', 'sales_manager'] },
    { name: 'Automations', label: t('automations'), href: createPageUrl('Automations'), icon: Zap, roles: ['company_admin'] },
    { name: 'Reports', label: t('reports'), href: createPageUrl('Reports'), icon: BarChart3, roles: ['company_admin', 'sales_manager'] },
    { name: 'AIFlows', label: 'Fluxos de IA', href: createPageUrl('AIFlows'), icon: Bot, roles: ['company_admin'] },
    { name: 'CompanySettings', label: 'Configurações da Empresa', href: createPageUrl('CompanySettings'), icon: Building2, roles: ['company_admin'] },
    { name: 'Settings', label: t('settings'), href: createPageUrl('Settings'), icon: Settings, roles: ['company_admin'] },
  ];

  const filteredNav = navigation.filter(item => 
    !teamMember?.role || item.roles.includes(teamMember.role)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-200 transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-slate-900">LeadFlow AI</span>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Company selector */}
          {company && (
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{company.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{teamMember?.role?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => {
              const isActive = currentPageName === item.name;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive 
                      ? "bg-indigo-50 text-indigo-700" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-slate-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-medium">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t('my_account')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(createPageUrl('Settings'))}>
                  <Settings className="w-4 h-4 mr-2" />
                  {t('settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold text-slate-900">{currentPageName}</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-slate-600" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                        {notifications.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>{t('notifications')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-500">
                      {t('no_results')}
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notif) => (
                      <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={notif.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                            {notif.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-slate-500">{notif.message}</p>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}