import AIFlows from './pages/AIFlows';
import AISimulator from './pages/AISimulator';
import Automations from './pages/Automations';
import Campaigns from './pages/Campaigns';
import CompanySettings from './pages/CompanySettings';
import ConversationFlows from './pages/ConversationFlows';
import Conversations from './pages/Conversations';
import Dashboard from './pages/Dashboard';
import FranchiseDashboard from './pages/FranchiseDashboard';
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
import TreinarAssistente from './pages/TreinarAssistente';
import VoiceCampaigns from './pages/VoiceCampaigns';
import VoiceSimulator from './pages/VoiceSimulator';
import Assistants from './pages/Assistants';
import VoiceFunnel from './pages/VoiceFunnel';
import ChannelsIntegrations from './pages/ChannelsIntegrations';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIFlows": AIFlows,
    "AISimulator": AISimulator,
    "Automations": Automations,
    "Campaigns": Campaigns,
    "CompanySettings": CompanySettings,
    "ConversationFlows": ConversationFlows,
    "Conversations": Conversations,
    "Dashboard": Dashboard,
    "FranchiseDashboard": FranchiseDashboard,
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
    "TreinarAssistente": TreinarAssistente,
    "VoiceCampaigns": VoiceCampaigns,
    "VoiceSimulator": VoiceSimulator,
    "Assistants": Assistants,
    "VoiceFunnel": VoiceFunnel,
    "ChannelsIntegrations": ChannelsIntegrations,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};