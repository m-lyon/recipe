# Recipe

Recipe Website

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`. After the tests pass, it builds the API and client
on Ubuntu 22.04 and deploys them to the server as the `deploy-recipe` account:

- API to `/srv/recipe`, run by the sandboxed `recipe.service` as `svc-recipe`.
- Client to `/var/www/recipes`, served by nginx at https://recipes.mattlyon.co.uk, with the API on the
  same origin at `/api/`. nginx terminates TLS; the API serves plain HTTP on `127.0.0.1`.

The Node version is pinned in `.nvmrc`. CI tests and builds with it, and the server runs it through a
shared nvm install (`/usr/local/nvm/nvm-exec` reads the deployed `.nvmrc`). Install a new version on
the server before bumping it here; the workflow checks and stops if it is missing.

Runtime configuration and secrets live on the server in `/etc/recipe.env`, not in the repository or CI.
The server has no public SSH port. The runner joins the tailnet as an ephemeral `tag:ci` node through
Tailscale workload identity federation, then deploys over SSH to the server's tailnet name.

The `production` environment needs these secrets: `TS_OAUTH_CLIENT_ID` and `TS_AUDIENCE` (the
Tailscale federated identity), `REMOTE_HOST` (the server's MagicDNS name), `REMOTE_PORT`,
`SSH_PRIVATE_KEY` and `SSH_KNOWN_HOSTS`.

The client is served from the site root. Set `VITE_ROOT_PATH` (e.g. `/recipes`) to serve it under a
path prefix instead, as the tests do.
