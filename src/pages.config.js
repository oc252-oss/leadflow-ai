import AIFlows from './pages/AIFlows';
import Automations from './pages/Automations';
import Campaigns from './pages/Campaigns';
import CompanySettings from './pages/CompanySettings';
import ConversationFlows from './pages/ConversationFlows';
import Conversations from './pages/Conversations';
import Dashboard from './pages/Dashboard';
import LeadDetail from './pages/LeadDetail';
import Leads from './pages/Leads';
import Onboarding from './pages/Onboarding';
import Pipeline from './pages/Pipeline';
import Reengagement from './pages/Reengagement';
import Reports from './pages/Reports';
import SalesFunnel from './pages/SalesFunnel';
import Settings from './pages/Settings';
import VoiceCampaigns from './pages/VoiceCampaigns';
import Tasks from './pages/Tasks';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIFlows": AIFlows,
    "Automations": Automations,
    "Campaigns": Campaigns,
    "CompanySettings": CompanySettings,
    "ConversationFlows": ConversationFlows,
    "Conversations": Conversations,
    "Dashboard": Dashboard,
    "LeadDetail": LeadDetail,
    "Leads": Leads,
    "Onboarding": Onboarding,
    "Pipeline": Pipeline,
    "Reengagement": Reengagement,
    "Reports": Reports,
    "SalesFunnel": SalesFunnel,
    "Settings": Settings,
    "VoiceCampaigns": VoiceCampaigns,
    "Tasks": Tasks,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};