'use client';

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  PointerEvent,
  WheelEvent,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Board } from '@prisma/client';
import styles from './board.module.sass';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type Point = { x: number; y: number };
type Stroke = Point[];

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function BoardClient({ data }: { data: Board }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ──────────────── UI / tool state ──────────────── */
  const [tool, setTool] = useState<'selector' | 'pencil'>('selector');

  /* ──────────────── view-transform (zoom + pan) ──── */
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });

  /* ──────────────── drawing model ─────────────────── */
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [draft, setDraft] = useState<Stroke>([]); // currently-drawn stroke

  /* ------------------------------------------------------------------ */
  /* Canvas size — always exactly the viewport, retina-sharp            */
  /* ------------------------------------------------------------------ */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr); // 1 css-px == 1 world-unit
    drawScene();
  }, []); // drawScene defined further down

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */
  const screenToWorld = (clientX: number, clientY: number): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left - view.tx) / view.scale,
      y: (clientY - rect.top - view.ty) / view.scale,
    };
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, pts: Stroke) => {
    if (pts.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    /* quadratic-curve smoothing */
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) * 0.5;
      const midY = (pts[i].y + pts[i + 1].y) * 0.5;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  };

  const applyTransform = (ctx: CanvasRenderingContext2D) => {
    ctx.setTransform(view.scale, 0, 0, view.scale, view.tx, view.ty);
  };

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    applyTransform(ctx);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2 / view.scale; // visually constant 2 px
    [...strokes, draft].forEach((s) => drawStroke(ctx, s));
    ctx.restore();
  }, [strokes, draft, view]);

  useEffect(drawScene, [drawScene]);

  /* ------------------------------------------------------------------ */
  /* Pointer-tool handlers                                              */
  /* ------------------------------------------------------------------ */
  const handlePointerDown = (e: PointerEvent) => {
    if (tool !== 'pencil') return;
    const pt = screenToWorld(e.clientX, e.clientY);
    setDraft([pt]);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!draft.length) return;
    setDraft((d) => [...d, screenToWorld(e.clientX, e.clientY)]);
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!draft.length) return;
    setStrokes((s) => [...s, draft]);
    setDraft([]);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  /* ------------------------- pan (space-drag or middle mouse) ------- */
  const panning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const startPan = (e: PointerEvent) => {
    if (tool !== 'selector' && e.button !== 1 && !e.shiftKey) return;
    panning.current = true;
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      tx: view.tx,
      ty: view.ty,
    };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const movePan = (e: PointerEvent) => {
    if (!panning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setView((v) => ({
      ...v,
      tx: panStart.current.tx + dx,
      ty: panStart.current.ty + dy,
    }));
  };

  const endPan = (e: PointerEvent) => {
    panning.current = false;
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  /* ------------------------- wheel-zoom centred on cursor ----------- */
  const handleWheel = (e: WheelEvent) => {
    const factor = Math.exp(-e.deltaY / 500);
    const newScale = Math.min(4, Math.max(0.1, view.scale * factor));
    if (newScale === view.scale) return;

    const { x, y } = screenToWorld(e.clientX, e.clientY);
    setView({
      scale: newScale,
      tx: e.clientX - x * newScale,
      ty: e.clientY - y * newScale,
    });
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <>
      {/* title bar */}
      <div className={styles.title}>
        <Link href="/dashboard">
          <h1>Boardsy</h1>
        </Link>
        <h2>{data.name}</h2>
      </div>

      {/* tool bar */}
      <div className={styles.tools}>
        <button onClick={() => setTool('selector')}>
          <Image src="/tools/selector.svg" alt="selector" width={50} height={50} />
        </button>
        <button onClick={() => setTool('pencil')}>
          <Image src="/tools/pencil.svg" alt="pencil" width={50} height={50} />
        </button>
      </div>

      {/* zoom controls */}
      <div className={styles.zoom}>
        <button
          onClick={() =>
            setView((v) => ({ ...v, scale: Math.max(0.1, v.scale / 1.25) }))
          }
        >
          <Image src="/tools/minus.svg" alt="zoom out" width={50} height={50} />
        </button>
        <div>{Math.round(view.scale * 100)} %</div>
        <button
          onClick={() =>
            setView((v) => ({ ...v, scale: Math.min(4, v.scale * 1.25) }))
          }
        >
          <Image src="/tools/plus.svg" alt="zoom in" width={50} height={50} />
        </button>
      </div>

      {/* drawing stage */}
      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            startPan(e);
            handlePointerDown(e);
          }}
          onPointerMove={(e) => {
            movePan(e);
            handlePointerMove(e);
          }}
          onPointerUp={(e) => {
            endPan(e);
            handlePointerUp(e);
          }}
          onWheel={handleWheel}
          className={
            tool === 'pencil' ? styles.pencilCursor : styles.grabbable
          }
        />
      </div>
    </>
  );
}
