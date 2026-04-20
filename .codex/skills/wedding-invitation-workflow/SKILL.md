---
name: wedding-invitation-workflow
description: Work efficiently on this static wedding invitation project. Use when modifying or reviewing frontend invitation UI, admin panel behavior, Google Apps Script backend flows, Vercel share/music handlers, RSVP/guest/config schemas, deployment docs, or project onboarding context for this repo.
---

# Wedding Invitation Workflow

## Quick Start

1. Read `AGENTS.md`.
2. Run `powershell -ExecutionPolicy Bypass -File tools/ai-snapshot.ps1`.
3. Read only the files related to the requested surface area.
4. Keep changes compatible with the existing no-build browser JavaScript architecture unless the user explicitly asks to add tooling.

## Surface Map

- Public invitation: `frontend/index.html`, `frontend/script.js`, `frontend/js/public/`, `frontend/js/shared/`, `frontend/style.css`.
- Admin panel: `frontend/admin.html`, `frontend/admin.js`, `frontend/js/admin/`, `frontend/admin.css`.
- Backend API: `backend-gas/Code.gs`.
- Vercel functions: `api/share.js`, `api/music.js`, `vercel.json`.
- Schema/normalization: `frontend/js/shared/schema/`, `frontend/js/shared/config-normalizer.js`, matching helpers in `backend-gas/Code.gs`.

## Working Rules

- Preserve Indonesian user-facing copy unless asked otherwise.
- Avoid reading or editing static asset catalogs unless the task is about assets.
- Treat `undangan digital.zip` as an ignored archive unless the user asks about it.
- Use Apps Script services only in `backend-gas/Code.gs`; do not introduce Node-specific APIs there.
- Keep Vercel handler logic server-only and avoid moving browser behavior into `api/`.
- Update `AGENTS.md` when project structure, deployment assumptions, or validation steps change.

## Validation

There is currently no `package.json` or automated test command.

- For frontend changes, inspect the affected HTML/CSS/JS and open the static pages when possible.
- For Apps Script changes, verify syntax manually and test after pasting/deploying in Apps Script.
- For Vercel handlers, test through Vercel or an equivalent local server if the environment is available.
