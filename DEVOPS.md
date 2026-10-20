# Local container workflow

The frontend, API, and MongoDB run in separate containers. Only the frontend is
published to the host. MongoDB stays on the private Compose network and stores
its files in a named volume.

## Start the stack

Copy the example settings and replace each `CHANGE_ME` value with a fresh value.
Generate one with `openssl rand -hex 24`. Keep `.env` private and do not commit it.

```bash
cp .env.example .env
openssl rand -hex 24
```

Build the images and start the containers:

```bash
docker compose up --build -d
```

Open <http://localhost:8080>. To use a different host port, change `HTTP_PORT`
in `.env` and recreate the frontend container.

## Handy commands

```bash
docker compose ps
docker compose logs -f
docker compose logs -f backend
docker compose down
```

`docker compose down` removes containers but keeps the MongoDB volume. To erase
the database data too, use `docker compose down --volumes`.

## What to remember for interviews

- The frontend image uses two stages: Node builds React, then Nginx serves only
  the static build. Build tools stay out of the runtime image.
- The backend image installs production dependencies in one stage, then copies
  them into a clean runtime stage. It runs as the unprivileged `node` user.
- Package manifests are copied before source code. Docker can reuse the npm
  dependency layer when only app source changes.
- Compose puts the services on a private network. Nginx reaches the API by its
  service name, `backend`; the browser reaches only the published frontend port.
- MongoDB uses its official image, a persistent named volume, and an init script
  that creates a limited app user. No custom database Dockerfile is needed.
- `.dockerignore` files keep local dependencies, build output, secrets, and Git
  history out of each image build context.

## EC2

Install Docker Engine and the Compose plugin on the instance, copy the repository
and a private `.env` there, then run `docker compose up --build -d`. Allow inbound
TCP 8080 only from the addresses that need the site. Do not publish MongoDB port
27017 or the API's port 5000. Use TLS and a domain name for public production
access, and store production secrets in a managed secret store.
