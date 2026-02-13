import { useEffect, useMemo, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { PitchCanvas } from '@/components/match/PitchCanvas';

type CreateMatchResponse = {
  matchId: string;
  seed: number;
  engineVersion: string;
};

type MatchSnapshot = {
  matchId: string;
  seq: number;
  serverTimeMs: number;
  clockSec: number;
  score: { A: number; B: number };
  ball: { x: number; y: number; z: number };
  players: Array<{
    id: string;
    team: 'A' | 'B';
    role: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    state: string;
    hasBall: boolean;
  }>;
};

const MATCH_API = 'http://localhost:3001';
const STREAM_WS = 'http://localhost:3003';

export function AdminPage() {
  const [matchId, setMatchId] = useState('');
  const [seed, setSeed] = useState<number | null>(null);
  const [engineVersion, setEngineVersion] = useState('v0');
  const [status, setStatus] = useState<
    'idle' | 'created' | 'started' | 'connected'
  >('idle');
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socket: Socket = useMemo(() => io(STREAM_WS, { autoConnect: false }), []);

  useEffect(() => {
    socket.on('connect', () => {
      setStatus((s) => (s === 'started' ? 'connected' : s));
    });
    socket.on('snapshot', (snap: MatchSnapshot) => {
      setSnapshot(snap);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [socket]);

  async function createMatch() {
    setError(null);
    setSnapshot(null);
    const res = await fetch(`${MATCH_API}/matches`, { method: 'POST' });
    if (!res.ok) throw new Error(`create match failed: ${res.status}`);
    const data = (await res.json()) as CreateMatchResponse;
    setMatchId(data.matchId);
    setSeed(data.seed);
    setEngineVersion(data.engineVersion);
    setStatus('created');
  }

  async function startMatch() {
    if (!matchId || seed === null) return;
    setError(null);
    const res = await fetch(`${MATCH_API}/matches/${matchId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed, engineVersion }),
    });
    if (!res.ok) throw new Error(`start match failed: ${res.status}`);
    setStatus('started');
  }

  function connectAndJoin() {
    if (!matchId) return;
    setError(null);
    if (!socket.connected) socket.connect();
    socket.emit('joinMatch', { matchId });
    setStatus('connected');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Outils internes: créer/démarrer un match et regarder le stream.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status === 'connected' ? 'default' : 'secondary'}>
              {status.toUpperCase()}
            </Badge>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Control Center</CardTitle>
              <CardDescription>
                Crée un match, démarre-le, puis connecte-toi au stream.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <label className="text-sm font-medium">Match ID</label>
                <Input
                  value={matchId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMatchId(e.target.value)
                  }
                  placeholder="m_..."
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-3">
                  <label className="text-sm font-medium">Seed</label>
                  <Input
                    value={seed ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSeed(Number(e.target.value))
                    }
                    placeholder="123"
                  />
                </div>
                <div className="grid gap-3">
                  <label className="text-sm font-medium">Engine</label>
                  <Input
                    value={engineVersion}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEngineVersion(e.target.value)
                    }
                    placeholder="v0"
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3">
              <Button
                onClick={() => createMatch().catch((e) => setError(String(e)))}
                variant="secondary"
              >
                Create match
              </Button>
              <Button
                onClick={() => startMatch().catch((e) => setError(String(e)))}
                disabled={status === 'idle' || !matchId || seed === null}
              >
                Start match
              </Button>
              <Button
                onClick={() => {
                  try {
                    connectAndJoin();
                  } catch (e) {
                    setError(String(e));
                  }
                }}
                variant="outline"
                disabled={!matchId}
              >
                Watch
              </Button>
            </CardFooter>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Match</CardTitle>
              <CardDescription>Terrain + rendu live (admin preview).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-xs text-muted-foreground">Score</div>
                  <div className="text-2xl font-semibold tabular-nums">
                    {snapshot ? `${snapshot.score.A} – ${snapshot.score.B}` : '–'}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-xs text-muted-foreground">Clock</div>
                  <div className="font-mono text-sm">
                    {snapshot ? `${snapshot.clockSec.toFixed(2)}s` : '–'}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-xs text-muted-foreground">Seq</div>
                  <div className="font-mono text-sm">{snapshot?.seq ?? '–'}</div>
                </div>
              </div>

              <PitchCanvas snapshot={snapshot} />

              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Ball</div>
                <div className="mt-1 font-mono text-xs">
                  {snapshot
                    ? `(${snapshot.ball.x.toFixed(1)}, ${snapshot.ball.y.toFixed(1)}, z=${snapshot.ball.z.toFixed(1)})`
                    : '–'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
