import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PitchCanvas } from '@/components/match/PitchCanvas';

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

const STREAM_WS = 'http://localhost:3003';
const MATCH_API = 'http://localhost:3001';

type LocationState = {
  liveMatches?: Array<{ matchId: string; url: string }>;
};

export function MatchPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);
  const state = (location.state ?? null) as LocationState | null;
  const [liveMatches, setLiveMatches] = useState<
    Array<{ matchId: string; url: string }>
  >(() => state?.liveMatches ?? []);

  const socket: Socket = useMemo(() => io(STREAM_WS, { autoConnect: false }), []);

  useEffect(() => {
    socket.on('snapshot', (snap: MatchSnapshot) => {
      setSnapshot(snap);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (!matchId) return;
    if (!socket.connected) socket.connect();
    socket.emit('joinMatch', { matchId });
  }, [socket, matchId]);

  useEffect(() => {
    if (!matchId) return;
    if (liveMatches.length > 0) return;

    let cancelled = false;

    const load = async () => {
      try {
        const matchRes = await fetch(`${MATCH_API}/matches/${matchId}`);
        if (!matchRes.ok) return;

        const matchData = (await matchRes.json()) as { leagueId: string };
        if (!matchData.leagueId) return;

        const liveRes = await fetch(
          `${MATCH_API}/leagues/${matchData.leagueId}/matches/live`,
        );
        if (!liveRes.ok) return;
        const liveData = (await liveRes.json()) as {
          matches: Array<{ matchId: string; url: string }>;
        };
        if (cancelled) return;
        setLiveMatches(liveData.matches ?? []);
      } catch {
        // ignore
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [matchId, liveMatches.length]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Match</h1>
            <p className="mt-2 text-sm text-muted-foreground font-mono">
              /match/{matchId}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/play')}>
              Back to Play
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin')}>
              Admin
            </Button>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>
                  Live — {snapshot ? `${snapshot.score.A} – ${snapshot.score.B}` : '–'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PitchCanvas snapshot={snapshot} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div>clock: {snapshot ? `${snapshot.clockSec.toFixed(2)}s` : '–'}</div>
                  <div className="font-mono">seq: {snapshot?.seq ?? '–'}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Other live matches</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {liveMatches.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    (Reviens depuis /play pour voir la liste, ou on ajoute un endpoint dédié.)
                  </div>
                ) : (
                  liveMatches.map((m) => (
                    <Button
                      key={m.matchId}
                      variant={m.matchId === matchId ? 'default' : 'outline'}
                      onClick={() => navigate(`/match/${m.matchId}`)}
                    >
                      {m.matchId}
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
