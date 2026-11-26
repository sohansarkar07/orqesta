/**
 * GET /api/environments                     — list all projects + environments
 * GET /api/environments/:projectId          — list environments for a project
 * GET /api/environments/:projectId/features — list feature states for all envs
 */

import { Router } from 'express';
import { requireClient } from '../credentials.js';
import { wrap } from '../middleware/errors.js';

export const environmentsRouter = Router();

environmentsRouter.get(
  '/',
  wrap(async (_req, res) => {
    const client = requireClient();
    const orgs = await client.getOrganisations();

    const result = await Promise.all(
      orgs.map(async (org) => {
        const projects = await client.getProjects(org.id);
        const projectsWithEnvs = await Promise.all(
          projects.map(async (project) => {
            const environments = await client.getEnvironments(project.id);
            return {
              id: project.id,
              name: project.name,
              // api_key intentionally omitted — never send to browser
              environments: environments.map((e) => ({
                id: e.id,
                name: e.name,
                // api_key kept server-side; frontend identifies envs by id/name
              })),
            };
          }),
        );
        return { id: org.id, name: org.name, projects: projectsWithEnvs };
      }),
    );

    res.json(result);
  }),
);

environmentsRouter.get(
  '/:projectId',
  wrap(async (req, res) => {
    const projectId = parseInt(String(req.params['projectId'] ?? ''), 10);
    if (isNaN(projectId)) {
      res.status(400).json({ error: 'Invalid project ID', code: 'VALIDATION_ERROR' });
      return;
    }

    const client = requireClient();
    const environments = await client.getEnvironments(projectId);

    res.json(
      environments.map((e) => ({
        id: e.id,
        name: e.name,
        description: e.description,
        created_date: e.created_date,
      })),
    );
  }),
);
