import { useEffect, useMemo, useRef } from 'react';

type TeamId = 'A' | 'B';

type MatchSnapshot = {
  score: { A: number; B: number };
  clockSec: number;
  ball: { x: number; y: number; z: number };
  players: Array<{ id: string; team: TeamId; x: number; y: number; hasBall: boolean }>;
};

type Props = {
  snapshot: MatchSnapshot | null;
  height?: number;
};

const PITCH_W = 900;
const PITCH_H = 520;

function drawPitch(ctx: CanvasRenderingContext2D) {
  // Background
  ctx.clearRect(0, 0, PITCH_W, PITCH_H);

  // Stripes
  for (let i = 0; i < 10; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#2d5a27' : '#335f2d';
    ctx.fillRect((i * PITCH_W) / 10, 0, PITCH_W / 10, PITCH_H);
  }

  // Lines
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, PITCH_W - 24, PITCH_H - 24);

  // Halfway line
  ctx.beginPath();
  ctx.moveTo(PITCH_W / 2, 12);
  ctx.lineTo(PITCH_W / 2, PITCH_H - 12);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(PITCH_W / 2, PITCH_H / 2, 70, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(PITCH_W / 2, PITCH_H / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Penalty areas (simple)
  const boxW = 120;
  const boxH = 240;
  ctx.strokeRect(12, (PITCH_H - boxH) / 2, boxW, boxH);
  ctx.strokeRect(PITCH_W - 12 - boxW, (PITCH_H - boxH) / 2, boxW, boxH);

  // Goals (simple)
  ctx.strokeRect(0, PITCH_H / 2 - 45, 12, 90);
  ctx.strokeRect(PITCH_W - 12, PITCH_H / 2 - 45, 12, 90);
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, z: number) {
  const r = 7;
  const shadow = Math.max(0, Math.min(12, z * 0.2));

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + shadow, r + 2, Math.max(2, r - 2), 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball
  ctx.fillStyle = '#f5f5dc';
  ctx.strokeStyle = '#c8b87a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - z * 0.2, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  team: TeamId,
  hasBall: boolean,
) {
  const r = 11;
  const fill = team === 'A' ? '#e8c84a' : '#e05252';
  const stroke = team === 'A' ? '#b89a20' : '#a03030';

  // Outline ring
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(x, y + 7, r + 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (hasBall) {
    ctx.strokeStyle = '#5dfc8c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function PitchCanvas({ snapshot, height = 520 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const renderState = useMemo(() => {
    if (!snapshot) return null;
    return {
      ball: snapshot.ball,
      players: snapshot.players,
    };
  }, [snapshot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Internal resolution matches engine coordinates.
    canvas.width = PITCH_W;
    canvas.height = PITCH_H;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawPitch(ctx);

    if (!renderState) return;

    // Players
    for (const p of renderState.players) {
      drawPlayer(ctx, p.x, p.y, p.team, p.hasBall);
    }

    // Ball last so it is on top.
    drawBall(ctx, renderState.ball.x, renderState.ball.y, renderState.ball.z);
  }, [renderState]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border bg-black/20"
      style={{ height }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
