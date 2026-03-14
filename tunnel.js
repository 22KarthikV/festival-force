#!/usr/bin/env node
/**
 * tunnel.js — Auto-restart localtunnel and keep Vercel env var in sync.
 * Usage: node tunnel.js
 *
 * Requires: VERCEL_TOKEN env var (or pass --token flag)
 *   node tunnel.js --token vcp_xxx
 */

const { execSync, spawn } = require("child_process");
const https = require("https");

// ── Config ────────────────────────────────────────────────────────────────────
const PORT = 8000;
const VERCEL_PROJECT = "festival-force-frontend"; // Vercel project name slug
const VERCEL_TEAM = "team_Pqyv3zK59kqj89RxQhYg0AQU";
const ENV_KEY = "NEXT_PUBLIC_BACKEND_URL";
const RETRY_DELAY_MS = 3000;

// Parse --token flag
const args = process.argv.slice(2);
const tokenFlag = args.indexOf("--token");
const VERCEL_TOKEN = tokenFlag !== -1 ? args[tokenFlag + 1] : process.env.VERCEL_TOKEN;

if (!VERCEL_TOKEN) {
  console.error("❌  No Vercel token. Pass --token <your_token> or set VERCEL_TOKEN env var.");
  process.exit(1);
}

// ── Vercel helpers ────────────────────────────────────────────────────────────
function vercelCLI(cmd) {
  try {
    return execSync(
      `npx vercel ${cmd} --token ${VERCEL_TOKEN} --yes`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim();
  } catch (e) {
    return e.stdout?.trim() || "";
  }
}

function updateVercelEnv(url) {
  console.log(`🔄  Updating Vercel env → ${url}`);
  vercelCLI(`env rm ${ENV_KEY} production`);
  execSync(
    `echo "${url}" | npx vercel env add ${ENV_KEY} production --token ${VERCEL_TOKEN} --yes`,
    { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
  );
  console.log("🚀  Deploying to Vercel...");
  const out = vercelCLI("deploy --prod");
  const match = out.match(/https:\/\/[^\s]+vercel\.app/);
  if (match) console.log(`✅  Live at: ${match[0]}`);
}

// ── Tunnel ────────────────────────────────────────────────────────────────────
function startTunnel() {
  console.log(`\n🔗  Starting localtunnel on port ${PORT}...`);
  const lt = spawn("npx", ["localtunnel", "--port", String(PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  let urlCaptured = false;

  lt.stdout.on("data", (data) => {
    const line = data.toString().trim();
    const match = line.match(/https:\/\/[a-z0-9-]+\.loca\.lt/);
    if (match && !urlCaptured) {
      urlCaptured = true;
      const url = match[0];
      console.log(`✅  Tunnel URL: ${url}`);
      updateVercelEnv(url);
    }
  });

  lt.stderr.on("data", (data) => {
    const msg = data.toString().trim();
    if (msg && !msg.includes("npm warn")) console.error(`[tunnel] ${msg}`);
  });

  lt.on("close", (code) => {
    console.log(`⚠️   Tunnel closed (code ${code}). Restarting in ${RETRY_DELAY_MS / 1000}s...`);
    setTimeout(startTunnel, RETRY_DELAY_MS);
  });

  lt.on("error", (err) => {
    console.error(`❌  Tunnel error: ${err.message}. Restarting...`);
    setTimeout(startTunnel, RETRY_DELAY_MS);
  });
}

// ── Entry ────────────────────────────────────────────────────────────────────
console.log("🎪  FestivalForce Tunnel Manager");
console.log("   Keeps localtunnel alive and Vercel in sync automatically.\n");
startTunnel();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋  Shutting down tunnel manager.");
  process.exit(0);
});
