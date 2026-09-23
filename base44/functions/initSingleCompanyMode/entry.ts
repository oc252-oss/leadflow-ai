import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Initialize single company mode - backend function
 * Creates default company and unit for single company mode operation
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const DEFAULT_COMPANY_NAME = 'CLINIQ.AI';
    const DEFAULT_UNIT_NAME = 'Unidade Principal';

    // Get or create default company
    const companies = await base44.asServiceRole.entities.Company.filter({ name: DEFAULT_COMPANY_NAME });
    let company;

    if (companies.length > 0) {
      company = companies[0];
    } else {
      company = await base44.asServiceRole.entities.Company.create({
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

    // Get or create default organization
    const organizations = await base44.asServiceRole.entities.Organization.filter({ name: DEFAULT_COMPANY_NAME });
    let organization;

    if (organizations.length > 0) {
      organization = organizations[0];
    } else {
      organization = await base44.asServiceRole.entities.Organization.create({
        name: DEFAULT_COMPANY_NAME,
        status: 'active'
      });
    }

    // Get or create default brand
    const brands = await base44.asServiceRole.entities.Brand.filter({ 
      organization_id: organization.id,
      name: DEFAULT_COMPANY_NAME 
    });
    let brand;

    if (brands.length > 0) {
      brand = brands[0];
    } else {
      brand = await base44.asServiceRole.entities.Brand.create({
        organization_id: organization.id,
        name: DEFAULT_COMPANY_NAME,
        status: 'active'
      });
    }

    // Get or create default unit
    const units = await base44.asServiceRole.entities.Unit.filter({ 
      organization_id: organization.id,
      name: DEFAULT_UNIT_NAME 
    });
    let unit;

    if (units.length > 0) {
      unit = units[0];
    } else {
      unit = await base44.asServiceRole.entities.Unit.create({
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

    return Response.json({
      success: true,
      data: {
        company,
        organization,
        brand,
        unit,
        mode: 'single_company'
      }
    });
  } catch (error) {
    console.error('Error initializing single company mode:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});