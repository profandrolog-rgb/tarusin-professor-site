# Project rules

- Track Minsk VPS deployments through the public GitHub Actions `deploy-minsk.yml` workflow, not the retired Timeweb API; workflow completion reflects deployment, not independent uptime.
- Enforce price-parsing pause at both existing function entrypoints and remove only their named schedules, so all callers are blocked without changing stored prices.
- Share abdominal ultrasound field definitions and print filtering across standalone and optional forms, storing the study in visit protocol JSON to avoid divergent copies.