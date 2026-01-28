import { base44 } from '@/api/base44Client';

/**
 * Single Company Mode Configuration
 * Simplifies the system to operate with automatic company/unit selection
 */

const SINGLE_COMPANY_MODE = true; // Flag to enable/disable single company mode
const DEFAULT_COMPANY_NAME = 'CLINIQ.AI';
const DEFAULT_UNIT_NAME = 'Unidade Principal';

/**
 * Initialize single company mode - creates default company and unit
 */
export const initializeSingleCompanyMode = async () => {
  if (!SINGLE_COMPANY_MODE) return null;

  try {
    // Get or create default company
    const companies = await base44.entities.Company.filter({ name: DEFAULT_COMPANY_NAME });
    let company;

    if (companies.length > 0) {
      company = companies[0];
    } else {
      company = await base44.entities.Company.create({
        name: DEFAULT_COMPANY_NAME,
        industry: 'healthcare',
        plan: 'premium',
        ai_enabled: true,
        status: 'active',
        timezone: 'America/Sao_Paulo',
        business_hours_start: '09:00',
        business_hours_end: '18:00',
        working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      });
    }

    // Get or create default organization (for future multi-company support)
    const organizations = await base44.entities.Organization.filter({ name: DEFAULT_COMPANY_NAME });
    let organization;

    if (organizations.length > 0) {
      organization = organizations[0];
    } else {
      organization = await base44.entities.Organization.create({
        name: DEFAULT_COMPANY_NAME,
        status: 'active'
      });
    }

    // Get or create default brand
    const brands = await base44.entities.Brand.filter({ 
      organization_id: organization.id,
      name: DEFAULT_COMPANY_NAME 
    });
    let brand;

    if (brands.length > 0) {
      brand = brands[0];
    } else {
      brand = await base44.entities.Brand.create({
        organization_id: organization.id,
        name: DEFAULT_COMPANY_NAME,
        status: 'active'
      });
    }

    // Get or create default unit
    const units = await base44.entities.Unit.filter({ 
      organization_id: organization.id,
      name: DEFAULT_UNIT_NAME 
    });
    let unit;

    if (units.length > 0) {
      unit = units[0];
    } else {
      unit = await base44.entities.Unit.create({
        organization_id: organization.id,
        brand_id: brand.id,
        name: DEFAULT_UNIT_NAME,
        code: 'UNI001',
        type: 'headquarters',
        status: 'active',
        timezone: 'America/Sao_Paulo',
        business_hours_start: '09:00',
        business_hours_end: '18:00',
        working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      });
    }

    return {
      company,
      organization,
      brand,
      unit,
      mode: 'single_company'
    };
  } catch (error) {
    console.error('Error initializing single company mode:', error);
    return null;
  }
};

/**
 * Get default company for single company mode
 */
export const getDefaultCompany = async () => {
  if (!SINGLE_COMPANY_MODE) return null;

  try {
    const companies = await base44.entities.Company.filter({ name: DEFAULT_COMPANY_NAME });
    return companies.length > 0 ? companies[0] : null;
  } catch (error) {
    console.error('Error getting default company:', error);
    return null;
  }
};

/**
 * Get default organization for single company mode
 */
export const getDefaultOrganization = async () => {
  if (!SINGLE_COMPANY_MODE) return null;

  try {
    const orgs = await base44.entities.Organization.filter({ name: DEFAULT_COMPANY_NAME });
    return orgs.length > 0 ? orgs[0] : null;
  } catch (error) {
    console.error('Error getting default organization:', error);
    return null;
  }
};

/**
 * Get default unit for single company mode
 */
export const getDefaultUnit = async (organizationId) => {
  if (!SINGLE_COMPANY_MODE) return null;

  try {
    const units = await base44.entities.Unit.filter({ 
      organization_id: organizationId,
      name: DEFAULT_UNIT_NAME 
    });
    return units.length > 0 ? units[0] : null;
  } catch (error) {
    console.error('Error getting default unit:', error);
    return null;
  }
};

/**
 * Check if single company mode is enabled
 */
export const isSingleCompanyMode = () => SINGLE_COMPANY_MODE;

export default {
  SINGLE_COMPANY_MODE,
  DEFAULT_COMPANY_NAME,
  DEFAULT_UNIT_NAME,
  initializeSingleCompanyMode,
  getDefaultCompany,
  getDefaultOrganization,
  getDefaultUnit,
  isSingleCompanyMode
};