// Utility functions for hierarchical access control and data visibility

export const ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  ORG_ADMIN: 'organization_admin',
  BRAND_MANAGER: 'brand_manager',
  UNIT_ADMIN: 'unit_admin',
  SALES_MANAGER: 'sales_manager',
  SALES_AGENT: 'sales_agent'
};

export const ROLE_HIERARCHY = {
  [ROLES.PLATFORM_ADMIN]: 6,
  [ROLES.ORG_ADMIN]: 5,
  [ROLES.BRAND_MANAGER]: 4,
  [ROLES.UNIT_ADMIN]: 3,
  [ROLES.SALES_MANAGER]: 2,
  [ROLES.SALES_AGENT]: 1
};

export const ROLE_LABELS = {
  [ROLES.PLATFORM_ADMIN]: 'Administrador da Plataforma',
  [ROLES.ORG_ADMIN]: 'Administrador da Organização',
  [ROLES.BRAND_MANAGER]: 'Gerente de Marca',
  [ROLES.UNIT_ADMIN]: 'Administrador da Unidade',
  [ROLES.SALES_MANAGER]: 'Gerente Comercial',
  [ROLES.SALES_AGENT]: 'Assistente'
};

// Check if a role has permission to perform an action
export function hasPermission(userRole, requiredRole) {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Check if user can edit brand-level settings
export function canEditBrandSettings(teamMember) {
  return hasPermission(teamMember.role, ROLES.BRAND_MANAGER);
}

// Check if user can edit unit-level settings
export function canEditUnitSettings(teamMember) {
  return hasPermission(teamMember.role, ROLES.UNIT_ADMIN);
}

// Check if user is unit-level (cannot see other units)
export function isUnitLevel(teamMember) {
  return !hasPermission(teamMember.role, ROLES.BRAND_MANAGER);
}

// Check if user is brand-level (can see all units in brand)
export function isBrandLevel(teamMember) {
  return teamMember.role === ROLES.BRAND_MANAGER;
}

// Check if user is org-level (can see all brands and units)
export function isOrgLevel(teamMember) {
  return hasPermission(teamMember.role, ROLES.ORG_ADMIN);
}

// Get accessible unit IDs for a team member
export function getAccessibleScope(teamMember) {
  if (isOrgLevel(teamMember)) {
    return {
      type: 'organization',
      organization_id: teamMember.organization_id
    };
  }
  
  if (isBrandLevel(teamMember)) {
    return {
      type: 'brand',
      organization_id: teamMember.organization_id,
      brand_id: teamMember.brand_id
    };
  }
  
  return {
    type: 'unit',
    organization_id: teamMember.organization_id,
    brand_id: teamMember.brand_id,
    unit_id: teamMember.unit_id
  };
}

// Build filter for entity queries based on scope
export function buildScopeFilter(teamMember, additionalFilters = {}) {
  const scope = getAccessibleScope(teamMember);
  
  const filter = {
    organization_id: scope.organization_id,
    ...additionalFilters
  };
  
  if (scope.type === 'brand') {
    filter.brand_id = scope.brand_id;
  }
  
  if (scope.type === 'unit') {
    filter.unit_id = scope.unit_id;
  }
  
  return filter;
}

// Check if a configuration is editable by the user
export function isConfigurationEditable(config, teamMember) {
  // Brand standards cannot be edited by unit users
  if (config.is_brand_standard && isUnitLevel(teamMember)) {
    return false;
  }
  
  // Brand managers can edit brand configs
  if (isBrandLevel(teamMember) && config.brand_id === teamMember.brand_id) {
    return true;
  }
  
  // Org admins can edit everything
  if (isOrgLevel(teamMember)) {
    return true;
  }
  
  // Unit admins can only edit unit-specific configs
  if (config.unit_id === teamMember.unit_id && !config.is_brand_standard) {
    return true;
  }
  
  return false;
}

// Get label for configuration source
export function getConfigurationSource(config) {
  if (config.is_brand_standard) {
    return {
      label: 'Padrão da Marca',
      color: 'blue',
      icon: '🏢'
    };
  }
  
  if (config.unit_id) {
    return {
      label: 'Configuração da Unidade',
      color: 'green',
      icon: '🏪'
    };
  }
  
  return {
    label: 'Padrão',
    color: 'gray',
    icon: '⚙️'
  };
}