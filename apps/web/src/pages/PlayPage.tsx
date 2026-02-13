import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const LEAGUE_API = 'http://localhost:3004';

type JoinResponse = {
  userId: string;
  lobbyId: string;
  endsAtMs: number;
};

type StatusResponse = {
  userId: string;
  assignedMatch?: { matchId: string; url: string };
  liveMatches?: Array<{ matchId: string; url: string }>;
  lobby?: { lobbyId: string; endsAtMs: number };
};

export function PlayPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('user_1');
  const [joined, setJoined] = useState(false);
  const [endsAtMs, setEndsAtMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [assignedMatch, setAssignedMatch] = useState<
    StatusResponse['assignedMatch']
  >(undefined);
  const [liveMatches, setLiveMatches] = useState<StatusResponse['liveMatches']>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const remainingSec = useMemo(() => {
    if (!endsAtMs) return null;
    return Math.max(0, Math.ceil((endsAtMs - nowMs) / 1000));
  }, [endsAtMs, nowMs]);

  async function join() {
    setError(null);
    const res = await fetch(`${LEAGUE_API}/play/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error(`join failed: ${res.status}`);
    const data = (await res.json()) as JoinResponse;
    setJoined(true);
    setEndsAtMs(data.endsAtMs);
  }

  useEffect(() => {
    if (!joined) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`${LEAGUE_API}/play/status/${userId}`);
        if (!res.ok) return;
        const data = (await res.json()) as StatusResponse;
        if (cancelled) return;

        setAssignedMatch(data.assignedMatch);
        setLiveMatches(data.liveMatches);
        if (data.lobby?.endsAtMs) setEndsAtMs(data.lobby.endsAtMs);

        if (data.assignedMatch?.matchId) {
          navigate(`/match/${data.assignedMatch.matchId}`, {
            replace: true,
            state: { liveMatches: data.liveMatches ?? [] },
          });
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    };

    void poll();
    const interval = setInterval(() => {
      void poll();
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [joined, userId, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Play</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Rejoins un lobby. Le serveur lance une ligue toutes les 30 secondes.
            </p>
          </div>
          <Badge variant={joined ? 'default' : 'secondary'}>
            {joined ? 'JOINED' : 'NOT JOINED'}
          </Badge>
        </div>

        <Separator className="my-8" />

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <div className="text-sm font-medium">User ID</div>
                <Input
                  value={userId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUserId(e.target.value)
                  }
                />
              </div>

              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button onClick={() => void join()} disabled={joined || !userId}>
                Join lobby
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="text-xs text-muted-foreground">Lobby ends in</div>
                <div className="text-2xl font-semibold tabular-nums">
                  {joined ? `${remainingSec ?? '…'}s` : '–'}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="text-xs text-muted-foreground">Assigned match</div>
                <div className="mt-1 font-mono text-xs">
                  {assignedMatch?.url ?? 'waiting…'}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="text-xs text-muted-foreground">Live matches</div>
                <div className="mt-2 grid gap-2">
                  {(liveMatches ?? []).length === 0 ? (
                    <div className="text-sm text-muted-foreground">—</div>
                  ) : (
                    (liveMatches ?? []).map((m) => (
                      <Button
                        key={m.matchId}
                        variant="outline"
                        onClick={() => navigate(`/match/${m.matchId}`)}
                      >
                        {m.matchId}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
