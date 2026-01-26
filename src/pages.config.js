import Automations from './pages/Automations';
import Campaigns from './pages/Campaigns';
import Conversations from './pages/Conversations';
import Dashboard from './pages/Dashboard';
import LeadDetail from './pages/LeadDetail';
import Leads from './pages/Leads';
import Onboarding from './pages/Onboarding';
import Pipeline from './pages/Pipeline';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ConversationFlows from './pages/ConversationFlows';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Automations": Automations,
    "Campaigns": Campaigns,
    "Conversations": Conversations,
    "Dashboard": Dashboard,
    "LeadDetail": LeadDetail,
    "Leads": Leads,
    "Onboarding": Onboarding,
    "Pipeline": Pipeline,
    "Reports": Reports,
    "Settings": Settings,
    "ConversationFlows": ConversationFlows,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};