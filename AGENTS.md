# Project rules

- Track Minsk VPS deployments through the public GitHub Actions `deploy-minsk.yml` workflow, not the retired Timeweb API; workflow completion reflects deployment, not independent uptime.
- Enforce price-parsing pause at both existing function entrypoints and remove only their named schedules, so all callers are blocked without changing stored prices.
- Share abdominal ultrasound field definitions and print filtering across standalone and optional forms, storing the study in visit protocol JSON to avoid divergent copies.
- Keep batch document import scoped to the current visit's anamnesis and require review before applying AI condensation, so historical records cannot overwrite today's clinical fields.
- Normalize laboratory extraction in a function-local helper before caching or saving, preserving per-page dates so multi-document replies cannot silently lose results.
- Prescription preview edits remain local to the printable form; print and PDF read that exact edited DOM so existing stored prescriptions remain unchanged.- Store multiple referral operations in the existing `operation_name` text as numbered lines (`joinOperations`/`splitOperations`), avoiding a schema change that would break old referrals and effectiveness matching.
- Store postoperative dressing fields in visit protocol JSON and reuse the operation history lookup and shared print layout, so existing visits and operation records remain unchanged.
- Physiotherapy session protocol (`physio_session`) keeps procedures in visit protocol JSON and prints per-session sheets from its own form, so the shared protocol print layout stays unchanged.

- Store school certificates inside the current visit protocol JSON and print a dedicated sheet, so no schema or shared protocol printing changes are required.

- Assess document workload locally before medical protocol recognition; require explicit fragmentation approval for long sources and retain per-part results, so oversized requests and silent cross-document merges are avoided.
- Keep remote-browser readiness checks in a manual, read-only GitHub Actions workflow sharing the Minsk deployment queue, so inspection cannot install services or overlap deployment.
