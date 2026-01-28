import AIAssistants from './pages/AIAssistants';
import AIAssistantsSimple from './pages/AIAssistantsSimple';
import AIFlows from './pages/AIFlows';
import AIFlowsSimple from './pages/AIFlowsSimple';
import AISimulator from './pages/AISimulator';
import AssistantCentral from './pages/AssistantCentral';
import Automations from './pages/Automations';
import Campaigns from './pages/Campaigns';
import ChannelsIntegrations from './pages/ChannelsIntegrations';
import ConversationFlows from './pages/ConversationFlows';
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
import TreinarAssistente from './pages/TreinarAssistente';
import Units from './pages/Units';
import VoiceCampaigns from './pages/VoiceCampaigns';
import VoiceFunnel from './pages/VoiceFunnel';
import VoiceSimulator from './pages/VoiceSimulator';
import WhatsAppChannels from './pages/WhatsAppChannels';
import WhatsAppIntegration from './pages/WhatsAppIntegration';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistants": AIAssistants,
    "AIAssistantsSimple": AIAssistantsSimple,
    "AIFlows": AIFlows,
    "AIFlowsSimple": AIFlowsSimple,
    "AISimulator": AISimulator,
    "AssistantCentral": AssistantCentral,
    "Automations": Automations,
    "Campaigns": Campaigns,
    "ChannelsIntegrations": ChannelsIntegrations,
    "ConversationFlows": ConversationFlows,
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
    "TreinarAssistente": TreinarAssistente,
    "Units": Units,
    "VoiceCampaigns": VoiceCampaigns,
    "VoiceFunnel": VoiceFunnel,
    "VoiceSimulator": VoiceSimulator,
    "WhatsAppChannels": WhatsAppChannels,
    "WhatsAppIntegration": WhatsAppIntegration,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};