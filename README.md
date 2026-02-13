# FootballManager (MVP#1)

Monorepo **npm workspaces**.

Voir aussi: `analyse de l'existant.md`.

## MVP#1 : Simulation server-authoritative + streaming live

### Services

- `match-service` (REST) : crée et démarre des matchs. Publie `evt.match.started`.
- `simulation-service` : consomme `evt.match.started`, exécute le moteur déterministe et publie `stream.match.snapshot` (10Hz).
- `stream-service` (WebSocket) : `joinMatch`, forward des snapshots vers les clients.
- `league-service` (REST) : lobby/league, publie `cmd.match.create` et consomme `evt.match.created`.
- `web` (React + Vite + Tailwind + shadcn-style) : UI pour créer/démarrer/rejoindre un match et afficher le flux.

### Ports (dev)

- match-service: `http://localhost:3001`
- simulation-service: `http://localhost:3002`
- stream-service: `http://localhost:3003`
- league-service: `http://localhost:3004`
- web: `http://localhost:5173`

## Prérequis

- Node.js (LTS recommandé)
- Docker Desktop

## Setup

```bash
npm install
```

## Lancer l'infra (NATS JetStream + Postgres)

```bash
docker compose -f infra/docker-compose.yml up
```

## Lancer l'app (5 terminaux)

### Match service

```bash
npm -w services/match-service run start:dev
```

### Simulation service

```bash
npm -w services/simulation-service run start:dev
```

### Stream service

```bash
npm -w services/stream-service run start:dev
```

### League service

```bash
npm -w services/league-service run start:dev
```

### Web

```bash
npm -w apps/web run dev
```

Ouvre ensuite `http://localhost:5173`.

## Flux end-to-end (manuel)

1. **Create match**
2. **Start match**
3. **Watch**
4. Vérifie que `seq` augmente et que la snapshot se met à jour.

## Notes

- Le frontend est sur **Tailwind v3** (downgrade depuis v4) pour éviter un souci de dépendance native (`lightningcss`) sur Windows lors du build.
