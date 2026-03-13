/**
 * IS29 Local Dev Server
 * Run: node serve.js
 * Then open the URL on your Android phone (same WiFi).
 *
 * No dependencies — pure Node.js built-ins only.
 */

const http = require("http");
const fs   = require("fs");
const path = require("path");
const os   = require("os");

const PORT    = 3000;
const DIST    = path.join(__dirname, "dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".woff2":"font/woff2",
  ".ico":  "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

// Get local network IP (the one your Android can reach)
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

// Tiny QR code generator (text art) — encodes a URL into terminal output
// Uses a minimal QR v3 algorithm for short URLs
function qrText(url) {
  // Just print the URL prominently — full QR would need a library
  // Instead we print a box the user can scan with any QR generator app
  return [
    "",
    "  ┌─────────────────────────────────────────┐",
    `  │  ${url.padEnd(41)}│`,
    "  │                                         │",
    "  │  Scan this URL or type it in Android    │",
    "  │  Chrome. Add to home screen for PWA.    │",
    "  └─────────────────────────────────────────┘",
    "",
  ].join("\n");
}

const server = http.createServer((req, res) => {
  // Strip query strings
  let urlPath = req.url.split("?")[0];

  // Default to index.html
  if (urlPath === "/" || urlPath === "") urlPath = "/index.html";

  const filePath = path.join(DIST, urlPath);

  // Security: block path traversal
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // For SPA: fall back to index.html on 404
      fs.readFile(path.join(DIST, "index.html"), (err2, indexData) => {
        if (err2) { res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, {
          "Content-Type": MIME[".html"],
          // Service workers need this header
          "Service-Worker-Allowed": "/",
        });
        res.end(indexData);
      });
      return;
    }

    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || "application/octet-stream";

    // Cache headers — don't cache SW or HTML, cache everything else
    const noCache = ext === ".html" || filePath.endsWith("sw.js");
    res.writeHead(200, {
      "Content-Type": mime,
      "Cache-Control": noCache ? "no-store" : "public, max-age=3600",
      "Service-Worker-Allowed": "/",
      // Allow SharedArrayBuffer (not strictly needed but good practice)
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    });
    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  const ip  = getLocalIP();
  const url = `http://${ip}:${PORT}`;

  console.clear();
  console.log("\x1b[33m╔══════════════════════════════════════════╗\x1b[0m");
  console.log("\x1b[33m║     INVENTORY SLOT 29 — Local Server     ║\x1b[0m");
  console.log("\x1b[33m╚══════════════════════════════════════════╝\x1b[0m");
  console.log("");
  console.log(`  \x1b[32m✓\x1b[0m Server running on \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`  \x1b[32m✓\x1b[0m Android URL:      \x1b[36m${url}\x1b[0m`);
  console.log(qrText(url));
  console.log("  \x1b[90mBoth devices must be on the same WiFi.\x1b[0m");
  console.log("  \x1b[90mIn Chrome on Android: tap ⋮ → Add to Home Screen\x1b[0m");
  console.log("  \x1b[90mPress Ctrl+C to stop.\x1b[0m\n");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\x1b[31m✗ Port ${PORT} is in use. Change PORT in serve.js.\x1b[0m`);
  } else {
    console.error("\x1b[31m✗ Server error:\x1b[0m", err.message);
  }
  process.exit(1);
});
