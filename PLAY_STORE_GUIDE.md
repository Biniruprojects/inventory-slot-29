# IS29 — Play Store Launch Guide
*Biniru Projects — Week 6 deliverable*

---

## STATUS OVERVIEW

| Item | Status | Notes |
|------|--------|-------|
| PWA: manifest.json | ✅ Done | maskable icons, categories, scope |
| PWA: service worker | ✅ Done | is29-v11, 179+ cached entries |
| PWA: offline play | ✅ Done | full offline support |
| Privacy policy | ✅ Done | `dist/privacy.html` |
| Leak file cleanup | ✅ Done | puzzle/, ___.pdf removed |
| Jagex fan policy | ⚠️ Review | See section below |
| PNG icons | ❌ TODO | 192×192, 512×512 maskable |
| Screenshots | ❌ TODO | 2 screenshots (min) |
| TWA build | ❌ TODO | Bubblewrap CLI |
| Play Store listing | ❌ TODO | Account + listing |

---

## STEP 1 — Generate Icons

You need two PNG icons:

```
assets/icon-192.png    → 192×192px
assets/icon-512.png    → 512×512px
```

Both must have **maskable safe zone**: keep all content within the inner 80%
(leave 10% padding on each side). Android crops icons into circles/squircles.

**Quickest method:**
1. Open https://maskable.app/editor
2. Upload your existing SVG logo or create a pixel icon
3. Export both sizes as PNG
4. Place in `dist/assets/`

The `manifest.json` already references them:
```json
{ "src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable any" }
{ "src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable any" }
```

---

## STEP 2 — Screenshots

Play Store requires **at least 2 screenshots**.
Recommended: 390×844px (iPhone 14 size, works for all stores).

1. Run the game on Chrome mobile simulator (F12 → 390×844)
2. Take screenshots of:
   - Main skills/bank screen (shows gameplay depth)
   - Adventure results screen (shows rewards/boss)
3. Save as PNG to `dist/screenshots/`

The manifest.json has placeholder entries — replace the `src` paths:
```json
"screenshots": [
  { "src": "screenshots/screen1.png", "sizes": "390x844" },
  { "src": "screenshots/screen2.png", "sizes": "390x844" }
]
```

---

## STEP 3 — Jagex Fan Content Policy

**URL:** https://legal.jagex.com/docs/policies/fan-content-policy

**Read before launch. Key questions to answer:**

### Already safe (verified):
- ✅ Disclaimer present: "A fan-made companion. Not affiliated with Jagex Ltd."
- ✅ No Jagex trademarks used (Grand Exchange → Trade Plaza, etc.)
- ✅ No OSRS art assets (own pixel art and SVGs)
- ✅ Own audio

### Requires Jagex policy confirmation:
- ❓ **Monetisation via ads** — The policy historically allows non-commercial fan content.
  5 ads/day may or may not be allowed. Check the current policy.
- ❓ **"Inspired by" vs "based on"** — The game mechanics are OSRS-inspired but
  all names, lore (RuneScape history text), and assets are independent.
  The lore text *about RuneScape history* in `lore.js` may need review.

### Decision tree:
```
Read policy → ads allowed under fan content? 
  YES → add "Fan Content Policy" badge/link in app
  NO  → two options:
    A) Remove ads, stay fan content (free to play, no monetisation)
    B) Strip all RS references, rebrand fully as independent IP
       (rename skills if needed, remove lore entries about Jagex/RS)
```

**Recommendation:** Option B (full independent IP) gives the most freedom
and removes legal uncertainty for Play Store. The game is already 95% there —
lore entries are the main remaining tie.

---

## STEP 4 — TWA Build (Trusted Web Activity)

TWA wraps your PWA in a native Android APK without a browser bar.

### Prerequisites:
- Node.js 18+
- Java JDK 17+
- Android SDK (or Android Studio)
- Google Play developer account ($25 one-time fee)

### Install Bubblewrap:
```bash
npm install -g @bubblewrap/cli
```

### Init the TWA project:
```bash
mkdir is29-twa && cd is29-twa
bubblewrap init --manifest https://YOUR_DOMAIN/manifest.json
```

Fill in the prompts:
- **Domain:** your hosting domain (e.g. `is29.biniru.gg`)
- **App name:** `Inventory Slot 29`
- **Package name:** `gg.biniru.is29`
- **Version code:** `1`
- **Version name:** `0.6.0`
- **Signing key:** generate a new keystore when prompted — **SAVE THE .keystore FILE AND PASSWORD**

### Build:
```bash
bubblewrap build
```
Outputs: `app-release-signed.apk`

### Digital Asset Links (critical for TWA):
Create `.well-known/assetlinks.json` at your domain root:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "gg.biniru.is29",
    "sha256_cert_fingerprints": ["YOUR_SIGNING_CERT_FINGERPRINT"]
  }
}]
```
Get the fingerprint from Bubblewrap output or:
```bash
keytool -list -v -keystore YOUR_KEY.keystore
```

**Without assetlinks.json, the TWA falls back to showing the browser bar.**

---

## STEP 5 — Play Store Listing

### Google Play Console setup:
1. Go to https://play.google.com/console
2. Create app → Android → Free → Not child-directed
3. Fill in:
   - **App name:** Inventory Slot 29
   - **Short description:** Idle RPG inspired by classic adventure games. Train 13 skills, fight bosses, go on adventures.
   - **Full description:** (see template below)
   - **Category:** Games → Role Playing
   - **Content rating:** Complete questionnaire (no violence, no in-app purchases, 5 ads/day)
   - **Privacy policy URL:** `https://YOUR_DOMAIN/privacy.html`

### Full description template:
```
⚔ INVENTORY SLOT 29 — The Idle RPG

Train 13 skills, explore 5 dangerous locations, and build your character in this 
pixel-art idle RPG.

FEATURES:
• 13 skills: Mining, Fishing, Woodcutting, Firemaking, Alchemy, Smithing, Cooking, 
  Attack, Strength, Defence, Hitpoints, Magic, Ranged
• 5 adventure locations with unique monsters and rare boss encounters
• Bank with 6 tabs for organised storage
• 3 shops: General Store, Weapon Shop, Magic Shop
• Pet collection system with passive bonuses
• Quest system with story rewards
• Skill milestones with permanent XP bonuses
• Prestige system for endless replayability
• Lore book: unlock the history of the game world as you progress
• Full offline support — play without internet

FREE TO PLAY
• No in-app purchases
• Max 5 ads per day — never forced, never intrusive
• Your progress is saved locally on your device

Fan-made game. Not affiliated with any company.
Open source (AGPL-3.0) — a gift to the community.
```

### Upload the APK:
- Go to Production → Create new release
- Upload `app-release-signed.apk`
- Release notes: "Initial release — v0.6.0"

---

## STEP 6 — Hosting

The PWA must be hosted over HTTPS for TWA to work.

**Free options:**
- **Netlify** (recommended): drag & drop `dist/` folder → instant HTTPS
- **GitHub Pages**: push `dist/` to a repo → enable Pages
- **Cloudflare Pages**: connect GitHub repo

**After hosting:**
1. Update `manifest.json` → `"start_url": "https://YOUR_DOMAIN/"`
2. Update `assetlinks.json` with your domain
3. Rebuild TWA with `bubblewrap build`

---

## TIMELINE ESTIMATE

| Task | Time needed |
|------|------------|
| Generate icons (maskable.app) | 30 min |
| Take 2 screenshots | 15 min |
| Read Jagex policy + decision | 1–2 hours |
| Set up hosting (Netlify) | 30 min |
| TWA build (Bubblewrap) | 1–2 hours |
| Play Store listing setup | 1–2 hours |
| **Google review wait** | **3–7 days** |

**Total active work: ~5–6 hours**
**Total calendar time with review: 1–2 weeks**

---

## KEYSTORE REMINDER ⚠️

When Bubblewrap generates your signing keystore:
- Save `is29-release.keystore` somewhere safe (not in the git repo)
- Save the password in a password manager
- **If you lose the keystore, you cannot update the app on Play Store.**
  You would need to create a new listing from scratch.

---

*Generated by IS29 build system — Week 6 / v0.6.0*
