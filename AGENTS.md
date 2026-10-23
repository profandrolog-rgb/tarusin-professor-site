# Project rules

- Track Minsk VPS deployments through the public GitHub Actions `deploy-minsk.yml` workflow, not the retired Timeweb API; workflow completion reflects deployment, not independent uptime.
- Enforce price-parsing pause at both existing function entrypoints and remove only their named schedules, so all callers are blocked without changing stored prices.