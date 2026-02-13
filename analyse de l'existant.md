# Analyse de l’existant — FootballManager

## 1) Vue d’ensemble (architecture)
- **Type**: monorepo **npm workspaces** (`apps/*`, `services/*`, `packages/*`).
- **Stack**:
  - **Backend services**: **NestJS** (Node/TypeScript), communication **NATS** (pub/sub JSON).
  - **Streaming**: **WebSocket Socket.IO** via `stream-service`.
  - **Frontend**: **React + Vite**, Tailwind v3, composants style shadcn.
  - **Infra dev**: `docker-compose` avec **NATS (JetStream activé)** + **Postgres** (mais Postgres n’est pas utilisé côté code à ce stade).

## 2) Structure des dossiers
- **`apps/web`**
  - UI pour créer/démarrer/regarder un match + pages `/match/:matchId`, `/play`, `/admin`.
- **`services/`**
  - `match-service` (REST + NATS)
  - `simulation-service` (NATS consumer + boucle de simulation)
  - `stream-service` (NATS consumer -> WebSocket)
  - `league-service` (REST + orchestration lobby/league + NATS)
- **`packages/`**
  - `contracts`: schémas Zod/types partagés (snapshots, events)
  - `sim-core`: moteur de simulation déterministe (tick 60Hz)

## 3) Tooling monorepo
- **Root `package.json`**
  - scripts utiles:
    - `infra:up` / `infra:down`
    - `dev:match`, `dev:sim`, `dev:stream`, `dev:league`, `dev:web`
    - `dev:mvp` lance tout “en parallèle” via `&` (attention: comportement Windows/powershell vs cmd peut varier)
- **TypeScript base**: `tsconfig.base.json` en mode strict.

## 4) Infra (NATS/Postgres) et implications
### `infra/docker-compose.yml`
- **NATS**: `nats:2.10` avec `-js` (JetStream), ports `4222` et monitoring `8222`.
- **Postgres**: `postgres:16` exposé en `5432`.

### Ce que le code utilise réellement
- Les services utilisent **NATS “core”** via `connect` et `nc.subscribe/nc.publish` + `JSONCodec`.
- **JetStream n’est pas utilisé dans le code** (pas de streams/consumers durables). Donc:
  - messages **non persistés**,
  - si un consumer est down, il **rate** les events,
  - pas de replay.

## 5) Contrats partagés (packages/contracts)
Dans `packages/contracts/src/index.ts`:
- **`MatchStartedEvent`**
  - `{ matchId: string, seed: int, engineVersion: string }`
- **`MatchSnapshot`**
  - contient `matchId`, `seq`, `serverTimeMs`, `clockSec`, `score`, `ball {x,y,z}`, `players[]`.
- Point notable: le moteur (`sim-core`) produit aussi des champs `vx/vy/vz` pour la balle + `events[]`, mais **le snapshot contract actuel ne les inclut pas** (la simulation “mappe” et drop certains champs).

## 6) Analyse des services (responsabilités + endpoints + events)

### A) `match-service` (port 3001)
**Entrée**: REST + orchestration par NATS.
- `POST /matches`
  - génère `matchId` aléatoire (`m_${Date.now()}_...`), seed random, `engineVersion='v0'`.
  - retourne `{matchId, seed, engineVersion}` (mais **ne persiste pas** et ne remplit pas la registry).
- `POST /matches/:matchId/start`
  - publie `evt.match.started` avec `{ matchId, seed, engineVersion }`.
- Registry mémoire:
  - `MatchRegistryService`: `Map` in-memory + index `leagueId -> matchIds`.
  - `GET /matches/:matchId` lit la registry et peut 404.
  - `GET /leagues/:leagueId/matches` et `/matches/live`.
- Orchestrateur NATS:
  - `MatchOrchestrator` subscribe `cmd.match.create`
  - calcule un `matchId` déterministe (`fnv1a32` sur `leagueId|round|aId|bId` → `m_${base36}`),
  - upsert registry en `in_progress`,
  - publie:
    - `evt.match.created` (avec leagueId/round/aId/bId/seed/engineVersion)
    - `evt.match.started`

**Points importants**
- Il y a **2 façons de créer un match**:
  - via REST `POST /matches` (match “local” non enregistré dans registry)
  - via NATS `cmd.match.create` (match “league” enregistré)
- Donc, `GET /matches/:matchId` marche surtout pour les matches créés via la ligue.

### B) `simulation-service` (port 3002)
- Subscribe: `evt.match.started`
- Pour chaque matchId:
  - crée un engine via `createEngine({matchId, seed, engineVersion})`
  - maintient `Map<matchId, engine>`
  - lance une boucle `setInterval` à **60Hz** et publie un snapshot à **10Hz** sur:
    - `stream.match.snapshot`
- Il ignore si `matchId` déjà running (warn).

**Points importants**
- Pas de stop/cleanup: l’engine reste en map tant que process vit (même si match fini; `FootballEngine` stoppe `running`, mais la map n’est pas purgée explicitement).
- Risque: si beaucoup de matches, fuite mémoire / timers multiples.

### C) `stream-service` (port 3003)
- **WebSocket gateway** (`Socket.IO`):
  - event `joinMatch` → rejoint room `match:${matchId}`
  - `emitSnapshot(matchId, snapshot)` → `server.to(room).emit('snapshot', snapshot)`
- `SnapshotForwarder`:
  - subscribe NATS `stream.match.snapshot`
  - forward vers websocket room correspondant au `matchId`

**Points importants**
- Aucune validation runtime du snapshot côté stream-service (il forward `any`).
- Pas de gestion de backpressure; si un client slow, Socket.IO buffer.

### D) `league-service` (port 3004)
- REST:
  - `POST /play/join` body `{ userId }`
  - `GET /play/status/:userId` renvoie lobby/league/assigned match/live matches
  - `GET /league/:leagueId` renvoie la structure de league
- Fonctionnement:
  - Maintient une **lobby** unique “open” 30s, capacité 16, remplit avec bots à la fermeture.
  - À la fermeture:
    - crée une league + génère **8 matches** (round 1) en pairant les 16 participants
    - publie `cmd.match.create` pour chaque match (avec seed + engineVersion)
  - Subscribe `evt.match.created`:
    - associe `matchId` au match (aId,bId,round) dans sa league
    - pour chaque humain, publie `evt.player.match_assigned` avec URL `http://localhost:5173/match/${matchId}`

**Points importants**
- État 100% in-memory (redémarrage = perte).
- NATS utilisé comme bus d’orchestration (mais sans persistence).

## 7) App Web (React/Vite)
### `App.tsx` (page “Control Center”)
- Hardcode:
  - `MATCH_API = http://localhost:3001`
  - `STREAM_WS = http://localhost:3003`
- Flow:
  - `createMatch()` → `POST /matches`
  - `startMatch()` → `POST /matches/:id/start`
  - `Watch`:
    - connect socket + `emit('joinMatch', {matchId})`
    - écoute `snapshot` → `setSnapshot`

### `pages/MatchPage.tsx`
- Route `/match/:matchId`
- Se connecte automatiquement et join match room.
- Essaie de charger “other live matches” en:
  - `GET /matches/:matchId` (pour obtenir `leagueId`)
  - puis `GET /leagues/:leagueId/matches/live`
- **Remarque**: si le match a été créé via `POST /matches` (hors league), `GET /matches/:matchId` peut 404 → pas de liste “other live matches”.

## 8) Dataflow end-to-end (MVP#1)
### Flow “solo” (UI Control Center)
1. Web `POST match-service /matches` → obtient (id, seed)
2. Web `POST /matches/:id/start` → `evt.match.started`
3. simulation-service consomme `evt.match.started` → publie `stream.match.snapshot` (10Hz)
4. stream-service consomme `stream.match.snapshot` → websocket `snapshot`
5. web affiche `PitchCanvas` + score/clock/seq

### Flow “league”
1. Web `POST league-service /play/join` jusqu’à remplissage / timeout
2. league-service publie `cmd.match.create` (x8)
3. match-service consomme `cmd.match.create`:
   - upsert registry
   - publie `evt.match.created` + `evt.match.started`
4. league-service consomme `evt.match.created` pour affecter `matchId` aux users
5. simulation-service + stream-service comme ci-dessus

## 9) Points faibles / risques techniques (priorisés)
- **Perte d’events**: NATS core sans JetStream → redémarrage/latence = trous (ex: simulation-service down au moment `evt.match.started`).
- **État volatile**:
  - `match-service` registry in-memory
  - `league-service` lobby/leagues in-memory
- **Incohérence de création de match**:
  - REST `POST /matches` ne met pas à jour la registry, contrairement à `cmd.match.create`.
- **Nettoyage match/simulation**:
  - `simulation-service` ne supprime pas les engines/timers après fin.
- **Contrats**:
  - `MatchSnapshot` contract != snapshot engine complet (pas `events`, pas vitesses balle) → OK si intentionnel, mais à formaliser.
- **Config/env**:
  - URLs hardcodées côté web; et `NATS_URL` fallback `localhost:4222` côté services.

## 10) Recommandations concrètes (si MVP#2)
- **Fiabiliser le bus**:
  - soit activer **JetStream** (durable consumer pour `evt.match.started` et éventuellement `stream.match.snapshot` si tu veux replay),
  - soit accepter “best-effort” mais ajouter une stratégie “resync”.
- **Unifier la création/registry match**:
  - faire que `POST /matches` “upsert” aussi dans `MatchRegistryService` (au moins `created`) ou publie `evt.match.created`.
- **Lifecycle simulation**:
  - purge l’engine quand `FULL_TIME` atteint (et stopper `setInterval` proprement).
- **Configuration**:
  - passer les URLs via env (`VITE_MATCH_API`, `VITE_STREAM_WS`) au lieu de hardcoder.
- **Persistence**:
  - introduire Postgres seulement quand tu as les modèles (league, match, assignments). Là, il est présent mais inutilisé.
