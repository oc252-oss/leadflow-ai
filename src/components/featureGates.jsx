// Feature gating based on company plan

export const PLANS = {
  FREE: 'free',
  PRO: 'pro',
  PREMIUM: 'premium'
};

export const PLAN_LABELS = {
  [PLANS.FREE]: 'Gratuito',
  [PLANS.PRO]: 'Pro',
  [PLANS.PREMIUM]: 'Premium'
};

// Feature definitions
export const FEATURES = {
  // AI Flows
  MULTIPLE_AI_FLOWS: 'multiple_ai_flows',
  AI_SIMULATOR: 'ai_simulator',
  
  // Voice
  VOICE_SIMULATOR: 'voice_simulator',
  VOICE_CAMPAIGNS: 'voice_campaigns',
  ACTIVE_PROSPECTING: 'active_prospecting',
  
  // Reengagement
  REENGAGEMENT: 'reengagement',
  REENGAGEMENT_EXTENDED: 'reengagement_extended', // 90+ days
  
  // Integrations
  WHATSAPP_INTEGRATION: 'whatsapp_integration',
  
  // Advanced
  ADVANCED_FUNNEL_METRICS: 'advanced_funnel_metrics',
  MULTI_ASSISTANT_PER_UNIT: 'multi_assistant_per_unit'
};

// Feature availability by plan
const FEATURE_MATRIX = {
  [PLANS.FREE]: [
    FEATURES.AI_SIMULATOR
  ],
  [PLANS.PRO]: [
    FEATURES.AI_SIMULATOR,
    FEATURES.MULTIPLE_AI_FLOWS,
    FEATURES.VOICE_SIMULATOR,
    FEATURES.REENGAGEMENT,
    FEATURES.WHATSAPP_INTEGRATION
  ],
  [PLANS.PREMIUM]: [
    FEATURES.AI_SIMULATOR,
    FEATURES.MULTIPLE_AI_FLOWS,
    FEATURES.VOICE_SIMULATOR,
    FEATURES.VOICE_CAMPAIGNS,
    FEATURES.ACTIVE_PROSPECTING,
    FEATURES.REENGAGEMENT,
    FEATURES.REENGAGEMENT_EXTENDED,
    FEATURES.WHATSAPP_INTEGRATION,
    FEATURES.ADVANCED_FUNNEL_METRICS,
    FEATURES.MULTI_ASSISTANT_PER_UNIT
  ]
};

// Limits by plan
export const PLAN_LIMITS = {
  [PLANS.FREE]: {
    ai_flows: 1,
    reengagement_max_days: 0,
    voice_campaigns: 0
  },
  [PLANS.PRO]: {
    ai_flows: 10,
    reengagement_max_days: 30,
    voice_campaigns: 0
  },
  [PLANS.PREMIUM]: {
    ai_flows: 999,
    reengagement_max_days: 180,
    voice_campaigns: 999
  }
};

export function hasFeature(plan, feature) {
  if (!plan) return false;
  const planFeatures = FEATURE_MATRIX[plan] || [];
  return planFeatures.includes(feature);
}

export function canAccessPage(plan, pageName) {
  if (!plan) return false;
  
  const pageFeatureMap = {
    'AIFlows': true,
    'AISimulator': FEATURES.AI_SIMULATOR,
    'VoiceSimulator': FEATURES.VOICE_SIMULATOR,
    'Reengagement': FEATURES.REENGAGEMENT,
    'Automations': true
  };
  
  const requiredFeature = pageFeatureMap[pageName];
  if (requiredFeature === true) return true;
  if (!requiredFeature) return true;
  
  return hasFeature(plan, requiredFeature);
}

export function getLimit(plan, limitType) {
  if (!plan) return PLAN_LIMITS[PLANS.FREE][limitType] || 0;
  return PLAN_LIMITS[plan]?.[limitType] || 0;
}

export function getUpgradeMessage(feature) {
  const messages = {
    [FEATURES.MULTIPLE_AI_FLOWS]: 'Upgrade para Pro para criar mais fluxos de IA',
    [FEATURES.VOICE_SIMULATOR]: 'Upgrade para Pro para testar campanhas de voz',
    [FEATURES.VOICE_CAMPAIGNS]: 'Upgrade para Premium para ativar campanhas de voz',
    [FEATURES.ACTIVE_PROSPECTING]: 'Upgrade para Premium para prospecção ativa',
    [FEATURES.REENGAGEMENT]: 'Upgrade para Pro para campanhas de reengajamento',
    [FEATURES.REENGAGEMENT_EXTENDED]: 'Upgrade para Premium para períodos estendidos',
    [FEATURES.WHATSAPP_INTEGRATION]: 'Upgrade para Pro para integrar WhatsApp',
    [FEATURES.ADVANCED_FUNNEL_METRICS]: 'Upgrade para Premium para métricas avançadas',
    [FEATURES.MULTI_ASSISTANT_PER_UNIT]: 'Upgrade para Premium para múltiplos assistentes'
  };
  
  return messages[feature] || 'Upgrade para desbloquear este recurso';
}

export function getRequiredPlan(feature) {
  for (const [plan, features] of Object.entries(FEATURE_MATRIX)) {
    if (features.includes(feature)) {
      return plan;
    }
  }
  return PLANS.PREMIUM;
}