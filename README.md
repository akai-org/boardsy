This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Getting started

Requirements
- Docker & Docker Compose
- PowerShell (commands below use PowerShell syntax)

Quick start:

```powershell
# Run all services, install dependencies and apply migrations
docker compose up --build
```

Open http://localhost:3000 to see the results.


Services one by one start:

1) Apply migrations (one-off):

```powershell
# Run the migrate service: installs dependencies and runs 'npx prisma migrate deploy'
docker compose -f .\docker-compose.yml run --rm migrate
```

2) Start the app and database in the background:

```powershell
docker compose -f .\docker-compose.yml up -d
```

3) Tail app logs:

```powershell
docker compose -f .\docker-compose.yml logs --follow --tail 200 app
```

Useful commands

```powershell
# Check service status
docker compose -f .\docker-compose.yml ps

# Run migrate manually (one-off / CI)
docker compose -f .\docker-compose.yml run --rm migrate

# List tables in the Postgres database
docker compose -f .\docker-compose.yml exec postgres psql -U admin -d boardsy -c "\dt"

# Stop and remove containers and volumes (including node_modules volume)
docker compose -f .\docker-compose.yml down --volumes
```

Why there is a `migrate` service?

- The `migrate` service is a one-off container that installs project dependencies and runs `npx prisma migrate deploy` against the database running in Compose. This avoids running migrations manually on the host.
- After migrations finish, the `migrate` container exits. This is expected.

About `node_modules` and Windows

- We use a named Docker volume for `node_modules` to avoid common Windows <-> container filesystem issues (for example, `ENOTEMPTY` errors during `npm install`). If something goes wrong, you can remove the volume with `docker compose down --volumes` and restart.

Troubleshooting (common issues)

- Can't reach database (`P1001` / "Can't reach database server at localhost:5432"): make sure services use the internal Compose hostname `postgres`. The compose file in this repo sets `LOCAL_DATABASE_URL` for `app` and `migrate` to use the `postgres` service.
- `ENOTEMPTY` during `npm install` in the container: handled by using a named `node_modules` volume. If it persists, remove that volume and retry.

Open http://localhost:3000 to see the results.

## Project structure (high level)

```bash
src/
├─ app/
│  ├─ layout.tsx     # Root layout (header, footer, metadata)
│  ├─ page.tsx       # Landing page
│  ├─ (sign)/        # Routes for user authentication
│  │  ├─ signin
│  │  └─ signup
│  └─ dashboard      # Main dashboard - allows viewing and managing boards
│     └─ profile     # Page for managing user's profile
│
├─ server/
│  ├─ actions/       # React server actions for retrieving and managing data
│  │  ├─ sign.ts     # Sign up, sign in and sign out
│  │  ├─ user.ts     # Managing user's profile
│  │  └─ board.ts    # Creating, retrieving, updating and deleting user's boards
│  ├─ auth.ts        # Session and cookie helpers
│  ├─ dal.ts         # Data access layer abstractions
│  ├─ db.ts          # Prisma client initialization
│  └─ utils.ts       # Miscellaneous server utilities
│
└─ types/
   └─ global.d.ts    # Global type declarations
```
