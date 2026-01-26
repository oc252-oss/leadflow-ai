import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Pipeline from './pages/Pipeline';
import Conversations from './pages/Conversations';
import Campaigns from './pages/Campaigns';
import Automations from './pages/Automations';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Leads": Leads,
    "LeadDetail": LeadDetail,
    "Pipeline": Pipeline,
    "Conversations": Conversations,
    "Campaigns": Campaigns,
    "Automations": Automations,
    "Reports": Reports,
    "Settings": Settings,
    "Onboarding": Onboarding,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};