// Generates the narration track with macOS's built-in speech synthesiser, then
// measures each clip so the video can size its scenes to the voice rather than
// the other way round. No network, no API key, no third-party TTS.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "audio");
const script = JSON.parse(fs.readFileSync(path.join(root, "src", "script.json"), "utf8"));

fs.mkdirSync(outDir, { recursive: true });

/** `afinfo` prints a human-readable dump; the duration line is the only bit we need. */
function durationOf(file) {
  const info = execFileSync("afinfo", [file], { encoding: "utf8" });
  const match = info.match(/estimated duration:\s*([\d.]+)\s*sec/);
  if (!match) throw new Error(`could not read duration of ${file}`);
  return Number(match[1]);
}

const manifest = [];

for (const scene of script.scenes) {
  const aiff = path.join(outDir, `${scene.id}.aiff`);
  const wav = path.join(outDir, `${scene.id}.wav`);

  execFileSync("say", ["-v", script.voice, "-r", String(script.rate), "-o", aiff, scene.text]);
  // Remotion wants a browser-decodable container; afconvert ships with macOS,
  // so this keeps the whole pipeline dependency-free.
  execFileSync("afconvert", ["-f", "WAVE", "-d", "LEI16@44100", "-c", "1", aiff, wav]);
  fs.rmSync(aiff);

  const durationInSeconds = durationOf(wav);
  manifest.push({ id: scene.id, durationInSeconds });
  console.log(`  ${scene.id.padEnd(12)} ${durationInSeconds.toFixed(2)}s`);
}

const total = manifest.reduce((sum, s) => sum + s.durationInSeconds, 0);
fs.writeFileSync(
  path.join(root, "src", "narration.json"),
  `${JSON.stringify({ scenes: manifest }, null, 2)}\n`,
);
console.log(`\n  total narration: ${Math.floor(total / 60)}m ${Math.round(total % 60)}s`);
