/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
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
import Help from './pages/Help';
import IntegrationHub from './pages/IntegrationHub';
import LeadDetail from './pages/LeadDetail';
import Leads from './pages/Leads';
import Onboarding from './pages/Onboarding';
import Pipeline from './pages/Pipeline';
import Reengagement from './pages/Reengagement';
import Reports from './pages/Reports';
import SalesFunnel from './pages/SalesFunnel';
import ScriptLibrary from './pages/ScriptLibrary';
import Scripts from './pages/Scripts';
import Settings from './pages/Settings';
import SimulationTraining from './pages/SimulationTraining';
import Tasks from './pages/Tasks';
import TreinarAssistente from './pages/TreinarAssistente';
import Units from './pages/Units';
import VoiceCampaigns from './pages/VoiceCampaigns';
import VoiceFunnel from './pages/VoiceFunnel';
import VoiceSimulator from './pages/VoiceSimulator';
import WhatsAppChannels from './pages/WhatsAppChannels';
import WhatsAppConfiguration from './pages/WhatsAppConfiguration';
import WhatsAppIntegration from './pages/WhatsAppIntegration';
import WhatsAppServerSetup from './pages/WhatsAppServerSetup';
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
    "Help": Help,
    "IntegrationHub": IntegrationHub,
    "LeadDetail": LeadDetail,
    "Leads": Leads,
    "Onboarding": Onboarding,
    "Pipeline": Pipeline,
    "Reengagement": Reengagement,
    "Reports": Reports,
    "SalesFunnel": SalesFunnel,
    "ScriptLibrary": ScriptLibrary,
    "Scripts": Scripts,
    "Settings": Settings,
    "SimulationTraining": SimulationTraining,
    "Tasks": Tasks,
    "TreinarAssistente": TreinarAssistente,
    "Units": Units,
    "VoiceCampaigns": VoiceCampaigns,
    "VoiceFunnel": VoiceFunnel,
    "VoiceSimulator": VoiceSimulator,
    "WhatsAppChannels": WhatsAppChannels,
    "WhatsAppConfiguration": WhatsAppConfiguration,
    "WhatsAppIntegration": WhatsAppIntegration,
    "WhatsAppServerSetup": WhatsAppServerSetup,
}

export const pagesConfig = {
    mainPage: "AIAssistants",
    Pages: PAGES,
    Layout: __Layout,
};