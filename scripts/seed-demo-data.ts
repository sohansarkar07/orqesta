/**
 * seed-demo-data.ts
 * Creates demo feature flags with intentional drift in a fresh Flagsmith instance.
 *
 * Usage:
 *   FLAGSMITH_API_KEY=<token> npx tsx scripts/seed-demo-data.ts
 *   FLAGSMITH_API_KEY=<token> FLAGSMITH_API_URL=http://localhost:8000/api/v1 npx tsx scripts/seed-demo-data.ts
 *
 * The script expects the following environments to already exist:
 *   - Staging
 *   - Production
 *
 * It will create/update flags to produce intentional drift between them.
 */

import axios from 'axios';

const API_KEY = process.env.FLAGSMITH_API_KEY;
const API_URL = (process.env.FLAGSMITH_API_URL ?? 'https://api.flagsmith.com/api/v1').replace(/\/$/, '');
const PROJECT_ID_ENV = process.env.FLAGSMITH_PROJECT_ID;

if (!API_KEY) {
  console.error('Error: FLAGSMITH_API_KEY environment variable is required.');
  process.exit(1);
}

const http = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Token ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrganisations() {
  const res = await http.get('/organisations/');
  return res.data.results as Array<{ id: number; name: string }>;
}

async function getProjects(orgId: number) {
  const res = await http.get(`/projects/?organisation=${orgId}`);
  return (Array.isArray(res.data) ? res.data : res.data.results) as Array<{ id: number; name: string }>;
}

async function getEnvironments(projectId: number) {
  const res = await http.get(`/environments/?project=${projectId}`);
  return (Array.isArray(res.data) ? res.data : res.data.results) as Array<{ id: number; name: string; api_key: string }>;
}

async function getFeatures(projectId: number) {
  const res = await http.get(`/projects/${projectId}/features/?page_size=200`);
  return (Array.isArray(res.data) ? res.data : res.data.results) as Array<{ id: number; name: string }>;
}

async function createFeature(projectId: number, name: string, value?: string, enabled?: boolean) {
  try {
    const res = await http.post(`/projects/${projectId}/features/`, {
      name,
      initial_value: value ?? null,
      default_enabled: enabled ?? false,
    });
    return res.data as { id: number; name: string };
  } catch (err: any) {
    // If feature already exists (409), fetch it
    if (err.response?.status === 400 && JSON.stringify(err.response?.data)?.includes('already exists')) {
      const features = await getFeatures(projectId);
      return features.find((f) => f.name === name) ?? null;
    }
    throw err;
  }
}

async function getFeatureStates(envApiKey: string) {
  const res = await http.get(`/environments/${envApiKey}/featurestates/?page_size=200`);
  return res.data.results as Array<{ id: number; feature: { id: number; name: string }; enabled: boolean; feature_state_value: any }>;
}

async function updateFeatureState(envApiKey: string, featureStateId: number, patch: { enabled?: boolean; feature_state_value?: any }) {
  const res = await http.patch(`/environments/${envApiKey}/featurestates/${featureStateId}/`, patch);
  return res.data;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('orqesta Demo Data Seeder');
  console.log('==========================');
  console.log(`API URL: ${API_URL}`);
  console.log('');

  // Resolve org and project
  const orgs = await getOrganisations();
  if (orgs.length === 0) {
    console.error('No organisations found. Check your API key.');
    process.exit(1);
  }

  const org = orgs[0]!;
  console.log(`Organisation: ${org.name} (id: ${org.id})`);

  const projects = await getProjects(org.id);
  if (projects.length === 0) {
    console.error('No projects found. Create a project in the Flagsmith dashboard first.');
    process.exit(1);
  }

  let projectId: number;
  if (PROJECT_ID_ENV) {
    projectId = parseInt(PROJECT_ID_ENV, 10);
  } else {
    // Pick the first project or one named "orqesta Demo"
    const demo = projects.find((p) => p.name.toLowerCase().includes('orqesta') || p.name.toLowerCase().includes('demo'));
    projectId = demo ? demo.id : projects[0]!.id;
  }

  const selectedProject = projects.find((p) => p.id === projectId) ?? projects[0]!;
  console.log(`Project: ${selectedProject.name} (id: ${projectId})`);

  // Get environments
  const environments = await getEnvironments(projectId);
  if (environments.length < 2) {
    console.error('Need at least 2 environments (Staging + Production). Create them in the Flagsmith dashboard first.');
    console.error(`Found: ${environments.map((e) => e.name).join(', ')}`);
    process.exit(1);
  }

  const staging = environments.find((e) => e.name.toLowerCase().includes('staging') || e.name.toLowerCase() === 'development');
  const production = environments.find((e) => e.name.toLowerCase().includes('production') || e.name.toLowerCase() === 'prod');

  if (!staging || !production) {
    console.error('Could not find Staging and Production environments.');
    console.error(`Found: ${environments.map((e) => `"${e.name}"`).join(', ')}`);
    console.error('Rename your environments to include "Staging" and "Production".');
    process.exit(1);
  }

  console.log(`Staging: "${staging.name}" (key: ${staging.api_key})`);
  console.log(`Production: "${production.name}" (key: ${production.api_key})`);
  console.log('');

  // Define demo flags
  const flags = [
    {
      name: 'checkout_redesign',
      description: 'New checkout flow — enabled in Staging, disabled in Production (intentional drift)',
      stagingEnabled: true,
      productionEnabled: false,
      stagingValue: null,
      productionValue: null,
    },
    {
      name: 'hero_text',
      description: 'Homepage hero message (value drift between envs)',
      stagingEnabled: true,
      productionEnabled: true,
      stagingValue: 'Save 20% Today',
      productionValue: 'Free Shipping',
    },
    {
      name: 'dark_mode',
      description: 'Dark mode toggle — same in both environments (no drift)',
      stagingEnabled: false,
      productionEnabled: false,
      stagingValue: null,
      productionValue: null,
    },
    {
      name: 'new_user_onboarding',
      description: 'New onboarding flow — enabled in Staging only',
      stagingEnabled: true,
      productionEnabled: false,
      stagingValue: null,
      productionValue: null,
    },
  ];

  // Ensure all flags exist in the project
  console.log('Creating feature flags...');
  for (const flag of flags) {
    await createFeature(projectId, flag.name, flag.stagingValue ?? undefined);
    console.log(`  ✓ ${flag.name}`);
  }
  console.log('');

  // Apply states to Staging
  console.log(`Configuring Staging environment (${staging.name})...`);
  const stagingStates = await getFeatureStates(staging.api_key);
  for (const flag of flags) {
    const state = stagingStates.find((s) => s.feature.name === flag.name);
    if (state) {
      await updateFeatureState(staging.api_key, state.id, {
        enabled: flag.stagingEnabled,
        feature_state_value: flag.stagingValue,
      });
      console.log(`  ✓ ${flag.name}: enabled=${flag.stagingEnabled}, value=${JSON.stringify(flag.stagingValue)}`);
    }
  }
  console.log('');

  // Apply states to Production
  console.log(`Configuring Production environment (${production.name})...`);
  const productionStates = await getFeatureStates(production.api_key);
  for (const flag of flags) {
    const state = productionStates.find((s) => s.feature.name === flag.name);
    if (state) {
      await updateFeatureState(production.api_key, state.id, {
        enabled: flag.productionEnabled,
        feature_state_value: flag.productionValue,
      });
      console.log(`  ✓ ${flag.name}: enabled=${flag.productionEnabled}, value=${JSON.stringify(flag.productionValue)}`);
    }
  }

  console.log('');
  console.log('Demo data seeded successfully!');
  console.log('');
  console.log('Expected drift:');
  console.log('  checkout_redesign: Staging=enabled, Production=disabled');
  console.log('  hero_text: Staging="Save 20% Today", Production="Free Shipping"');
  console.log('  new_user_onboarding: Staging=enabled, Production=disabled');
  console.log('  dark_mode: same in both (no drift)');
  console.log('');
  console.log('Now run:');
  console.log(`  node dist/cli/index.js compare ${staging.name} ${production.name}`);
  console.log('');
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Error: ${message}`);
  process.exit(1);
});
