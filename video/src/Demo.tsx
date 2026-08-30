import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BrowserWindow, ClickRing, Cursor } from "./ui/Chrome";
import { ParityApp } from "./ui/ParityApp";
import { honestLedger, initialState, tamperedLedger, type DemoState } from "./ui/state";
import { resolve, type Action } from "./ui/choreo";
import narration from "./narration.json";
import "./ui/app.css";

export const FPS = 30;
const LEAD_IN = 0.5;
/** The window is authored at 1240x760 and scaled to fill a 1080p frame. */
const ZOOM = 1.28;
const TAIL = 1.0;

/**
 * Click targets, in viewport coordinates, measured off rendered stills.
 * They are quoted for the resting layout: base scroll, no banner on screen.
 * A visible banner pushes the panels down by exactly one banner height, so
 * `lower()` adjusts a target for the moments when one is showing.
 */
const AT = {
  connect: [1086, 45] as [number, number],
  deploy: [201, 510] as [number, number],
  commit: [188, 564] as [number, number],
  tampered: [208, 422] as [number, number],
  worker: [971, 280] as [number, number],
  confirm: [903, 414] as [number, number],
  dispute: [903, 467] as [number, number],
  idle: [660, 240] as [number, number],
};

const BANNER = 60;
const lower = ([x, y]: [number, number]): [number, number] => [x, y + BANNER];

const CONTRACT = "0200a3f19c4e7b5d08ad2c61f4e9b7302c8d15af6e";
const TX = "0x8f3ac21d94b7e05f16c2";

const connected = (over: Partial<DemoState> = {}): DemoState => ({
  ...initialState,
  wallet: "connected",
  ...over,
});

type Scene = {
  id: string;
  base: DemoState;
  startCursor: [number, number];
  startScroll: number;
  actions: Action[];
  caption?: string;
};

/** The connected scenes open scrolled to the action row, as a user would be;
 *  panel 4 sits further down the page, exactly as it does in the real app. */
const SCROLL_TOP = 0;
const SCROLL_ACTIONS = 220;
const SCROLL_COVERAGE = 440;

const honest = honestLedger();
const tampered = tamperedLedger();

const SCENES: Scene[] = [
  {
    id: "s1-problem",
    base: initialState,
    startCursor: AT.idle,
    startScroll: SCROLL_TOP,
    actions: [],
    caption: "The number nobody can check",
  },
  {
    id: "s2-connect",
    base: initialState,
    startCursor: [660, 300],
    startScroll: SCROLL_TOP,
    actions: [
      { at: 1.2, moveTo: AT.connect },
      { at: 2.0, click: true, patch: { wallet: "connecting" } },
      { at: 3.2, patch: { wallet: "connected" } },
      { at: 4.0, moveTo: [660, 300] },
    ],
  },
  {
    id: "s3-commit",
    base: connected(),
    startCursor: AT.idle,
    startScroll: SCROLL_ACTIONS,
    actions: [
      { at: 5.4, moveTo: AT.deploy },
      { at: 6.2, click: true, patch: { busy: "Deploying the filing contract…" } },
      { at: 8.4, patch: { busy: null, contractAddress: CONTRACT, okTx: TX } },
      { at: 9.2, moveTo: lower(AT.commit) },
      { at: 10.0, click: true, patch: { busy: "Proving and committing the payroll…", okTx: null } },
      { at: 17.2, patch: { busy: null, committed: true, okTx: TX, ledger: honest } },
      { at: 18.2, moveTo: lower(AT.idle) },
    ],
    caption: "Aggregates computed inside the circuit",
  },
  {
    id: "s4-public",
    base: connected({ contractAddress: CONTRACT, committed: true, okTx: TX, ledger: honest }),
    startCursor: lower(AT.idle),
    startScroll: SCROLL_ACTIONS,
    actions: [
      { at: 2.0, moveTo: [560, 215] },
      { at: 7.5, moveTo: [700, 252] },
      { at: 11.0, moveTo: [700, 285] },
      { at: 14.5, moveTo: [660, 340] },
    ],
    caption: "Totals become public. Salaries never do.",
  },
  {
    id: "s5-confirm",
    base: connected({ contractAddress: CONTRACT, committed: true, ledger: honest }),
    startCursor: AT.idle,
    startScroll: SCROLL_ACTIONS,
    actions: [
      { at: 3.4, moveTo: AT.confirm },
      { at: 4.2, click: true, patch: { busy: "Proving your record…" } },
      { at: 6.0, patch: { busy: null, ledger: { ...honest, confirmations: 1 }, selected: 1 } },
      { at: 7.0, click: true, patch: { busy: "Proving your record…" } },
      { at: 8.6, patch: { busy: null, ledger: { ...honest, confirmations: 2 }, selected: 2 } },
      { at: 9.4, click: true, patch: { busy: "Proving your record…" } },
      { at: 11.0, patch: { busy: null, ledger: { ...honest, confirmations: 3 }, selected: 3 } },
      { at: 11.8, click: true, patch: { busy: "Proving your record…" } },
      { at: 13.4, patch: { busy: null, ledger: { ...honest, confirmations: 4 } } },
      { at: 14.2, moveTo: [660, 200], scrollTo: SCROLL_COVERAGE },
    ],
    caption: "Proved in zero knowledge, one worker at a time",
  },
  {
    id: "s6-tamper",
    base: connected({ mode: "tampered" }),
    startCursor: AT.idle,
    startScroll: SCROLL_ACTIONS,
    actions: [
      { at: 1.6, moveTo: AT.deploy },
      { at: 2.4, click: true, patch: { busy: "Deploying the filing contract…" } },
      { at: 4.0, patch: { busy: null, contractAddress: CONTRACT, okTx: TX } },
      { at: 4.8, moveTo: lower(AT.commit) },
      { at: 5.6, click: true, patch: { busy: "Proving and committing the payroll…", okTx: null } },
      { at: 9.4, patch: { busy: null, committed: true, okTx: TX, ledger: tampered } },
      { at: 12.2, moveTo: lower(AT.confirm), patch: { selected: 1 } },
      { at: 13.2, click: true, patch: { ledger: { ...tampered, confirmations: 1 }, selected: 2 } },
      { at: 14.6, click: true, patch: { ledger: { ...tampered, confirmations: 2 }, selected: 3 } },
      { at: 16.0, click: true, patch: { ledger: { ...tampered, confirmations: 3 } } },
    ],
    caption: "One row inflated — the gap flatters to 9.4%",
  },
  {
    id: "s7-catch",
    base: connected({
      mode: "tampered",
      contractAddress: CONTRACT,
      committed: true,
      okTx: TX,
      selected: 3,
      ledger: { ...tampered, confirmations: 3 },
    }),
    startCursor: lower(AT.confirm),
    startScroll: SCROLL_ACTIONS,
    actions: [
      { at: 0.8, moveTo: lower(AT.worker) },
      { at: 1.6, click: true, patch: { selected: 0 } },
      { at: 2.8, moveTo: lower(AT.confirm) },
      { at: 3.6, click: true, patch: { busy: "Proving your record…", okTx: null } },
      {
        at: 7.0,
        patch: {
          busy: null,
          error: "Your record does not match the payroll that was filed. You can dispute it instead.",
        },
      },
      { at: 11.0, moveTo: lower(AT.dispute) },
      { at: 12.0, click: true, patch: { busy: "Proving the mismatch…", error: null } },
      {
        at: 15.0,
        patch: {
          busy: null,
          okTx: TX,
          ledger: { ...tampered, confirmations: 3, disputes: 1 },
        },
      },
      { at: 16.2, moveTo: [660, 200], scrollTo: SCROLL_COVERAGE },
    ],
    caption: "The lie surfaces. The pay does not.",
  },
];

function SceneView({ scene, durationInFrames }: { scene: Scene; durationInFrames: number }) {
  const frame = useCurrentFrame();
  const t = frame / FPS - LEAD_IN;
  const { state, cursor, click, scrollY } = resolve(
    scene.base,
    scene.actions,
    scene.startCursor,
    scene.startScroll,
    t,
  );

  const captionOpacity = scene.caption
    ? interpolate(
        frame,
        [12, 30, durationInFrames - 26, durationInFrames - 10],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 0;

  return (
    <AbsoluteFill className="stage">
      {/* The window and the pointer share one coordinate space, then scale
          together — so click targets stay in window pixels no matter how the
          frame is sized. */}
      <div style={{ width: 1240, height: 760, position: "relative", transform: `scale(${ZOOM})` }}>
        <BrowserWindow scrollY={scrollY}>
          <ParityApp state={state} spinnerAngle={state.busy ? frame * 13 : 0} />
        </BrowserWindow>
        <div style={{ position: "absolute", left: 0, top: 46, width: 1240, height: 714, overflow: "hidden" }}>
          {click && <ClickRing x={click.x} y={click.y} progress={click.progress} />}
          <Cursor x={cursor.x} y={cursor.y} />
        </div>
      </div>
      {scene.caption && (
        <div className="caption" style={{ opacity: captionOpacity }}>
          <span>{scene.caption}</span>
        </div>
      )}
    </AbsoluteFill>
  );
}

function TitleCard({ durationInFrames }: { durationInFrames: number }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill className="title-card" style={{ opacity }}>
      <span className="mark" />
      <h1>Parity</h1>
      <p>A gender pay-gap filing that can be verified — without anyone seeing a single salary.</p>
    </AbsoluteFill>
  );
}

function EndCard() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill className="title-card" style={{ opacity }}>
      <span className="mark" />
      <h1>Parity</h1>
      <p>Verifiable pay-gap reporting, built on Midnight.</p>
      <div className="links">
        <span><strong>parity-tech.vercel.app</strong></span>
        <span><strong>github.com/artomily/parity</strong></span>
        <span><strong>@paritycompany</strong></span>
      </div>
    </AbsoluteFill>
  );
}

export const TOTAL_FRAMES = narration.scenes.reduce(
  (sum, s) => sum + Math.round((s.durationInSeconds + LEAD_IN + TAIL) * FPS),
  0,
);

export function ParityDemo() {
  const { fps } = useVideoConfig();
  let cursorFrame = 0;

  return (
    <AbsoluteFill style={{ background: "#dfe4ec" }}>
      {narration.scenes.map((n) => {
        const from = cursorFrame;
        const duration = Math.round((n.durationInSeconds + LEAD_IN + TAIL) * fps);
        cursorFrame += duration;
        const scene = SCENES.find((s) => s.id === n.id);

        return (
          <Sequence key={n.id} from={from} durationInFrames={duration}>
            {scene ? (
              <SceneView scene={scene} durationInFrames={duration} />
            ) : n.id === "s8-close" ? (
              <EndCard />
            ) : null}
            {n.id === "s1-problem" && <TitleCard durationInFrames={Math.round(9.2 * fps)} />}
            <Sequence from={Math.round(LEAD_IN * fps)}>
              <Audio src={staticFile(`audio/${n.id}.wav`)} />
            </Sequence>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
