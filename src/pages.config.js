import AIAssistants from './pages/AIAssistants';
import AIFlows from './pages/AIFlows';
import Automations from './pages/Automations';
import Campaigns from './pages/Campaigns';
import ChannelsIntegrations from './pages/ChannelsIntegrations';
import Conversations from './pages/Conversations';
import Dashboard from './pages/Dashboard';
import FranchiseDashboard from './pages/FranchiseDashboard';
import IntegrationHub from './pages/IntegrationHub';
import LeadDetail from './pages/LeadDetail';
import Leads from './pages/Leads';
import Onboarding from './pages/Onboarding';
import Pipeline from './pages/Pipeline';
import Reengagement from './pages/Reengagement';
import Reports from './pages/Reports';
import SalesFunnel from './pages/SalesFunnel';
import Settings from './pages/Settings';
import SimulationTraining from './pages/SimulationTraining';
import Tasks from './pages/Tasks';
import Units from './pages/Units';
import VoiceCampaigns from './pages/VoiceCampaigns';
import VoiceFunnel from './pages/VoiceFunnel';
import WhatsAppChannels from './pages/WhatsAppChannels';
import WhatsAppIntegration from './pages/WhatsAppIntegration';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistants": AIAssistants,
    "AIFlows": AIFlows,
    "Automations": Automations,
    "Campaigns": Campaigns,
    "ChannelsIntegrations": ChannelsIntegrations,
    "Conversations": Conversations,
    "Dashboard": Dashboard,
    "FranchiseDashboard": FranchiseDashboard,
    "IntegrationHub": IntegrationHub,
    "LeadDetail": LeadDetail,
    "Leads": Leads,
    "Onboarding": Onboarding,
    "Pipeline": Pipeline,
    "Reengagement": Reengagement,
    "Reports": Reports,
    "SalesFunnel": SalesFunnel,
    "Settings": Settings,
    "SimulationTraining": SimulationTraining,
    "Tasks": Tasks,
    "Units": Units,
    "VoiceCampaigns": VoiceCampaigns,
    "VoiceFunnel": VoiceFunnel,
    "WhatsAppChannels": WhatsAppChannels,
    "WhatsAppIntegration": WhatsAppIntegration,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};