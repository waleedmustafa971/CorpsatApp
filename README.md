# Cropsat — Farmer Mobile App

React Native (Expo, TypeScript) app for the **farmer** side of Cropsat, the satellite
crop-monitoring and agricultural-insurance platform for Sudan. Farmers sign in with a
phone number, draw their field boundary on a map, submit it to their insurer, and track
the health of approved fields from satellite imagery.

It pairs with the existing **admin web panel**, where a manager reviews and approves each
submission. This app produces `status: "submitted"` records and reads the status back.

Everything runs on **mock data persisted locally** — there is no backend yet. See
[Swapping in a real backend](#swapping-in-a-real-backend).

---

## Running it

```bash
npm install
npm start          # then press "a" for Android, "i" for iOS, or scan the QR in Expo Go
```

| Command | What it does |
|---|---|
| `npm start` | Expo dev server (Expo Go, dev builds, simulators) |
| `npm run android` | Launch on an Android device/emulator |
| `npm run ios` | Launch on an iOS simulator (macOS only) |
| `npm run web` | Run in a browser — useful for a quick look, see [Maps](#maps) |
| `npm run typecheck` | `tsc --noEmit` |

**Demo login:** phone `+249 900 000 000`, then **any** OTP code. The login screen has a
"Demo account" card that fills the number for you.

`+249 911 222 333` is seeded with `canLogin: false` and demonstrates the blocked-login
error.

---

## What's in it

| Screen | Route | Notes |
|---|---|---|
| Login | `app/(auth)/login.tsx` | Phone entry, friendly errors for unregistered / disabled numbers |
| OTP | `app/(auth)/otp.tsx` | 6-box code input, auto-submits on the last digit, resend with cooldown |
| My Farms | `app/(tabs)/index.tsx` | Summary strip, pending-review banner, farm cards with status + health |
| Add Farm | `app/(tabs)/add.tsx` | 3-step wizard → success panel |
| Farm detail | `app/farm/[id].tsx` | Health ring, NDVI map, index tiles, season chart, capture history |
| Profile | `app/(tabs)/profile.tsx` | Farmer details, reset demo data, log out |

The **Add Farm** wizard lives in `src/screens/AddFarm/`:

1. **Draw boundary** — tap the satellite map to place corners; undo / clear / centre on
   your location; a manual `lon,lat | lon,lat` paste box matching the web panel; live point
   count and measured acreage.
2. **Details** — name, land size (with a one-tap "use the measured area"), region, crop,
   irrigation, soil. All required.
3. **Review & submit** — read-only summary with a boundary preview, then *Submit for review*.

Farm lifecycle, shared with the web panel:

```
Farmer submits (source: "app") ──► status: "submitted" ──► Manager reviews
                                                                 │
                                                  ┌──────────────┴──────────────┐
                                                  ▼                             ▼
                                          status: "active"            status: "rejected"
                                          (monitored/insured)         (+ optional reviewNote)
```

A submitted farm's detail screen has a clearly-labelled **"Simulate insurer approval"**
demo button so you can see the approved state without the web panel. It is the only
write the app makes that a farmer could not make in production.

---

## Project layout

```
app/                        # expo-router file-based routes
  _layout.tsx               # fonts, session gate, splash handling
  index.tsx                 # redirects to the app or to sign-in
  (auth)/                   # login → otp
  (tabs)/                   # My Farms · Add Farm · Profile
  farm/[id].tsx             # farm detail
src/
  components/               # design-system primitives (Button, Card, Field, Select,
                            #   Badge, HealthRing, Sparkline, FarmMap, TabBar, …)
  screens/AddFarm/          # the three wizard steps + step header
  services/
    seed.ts                 # mock farmers / farms / snapshots
    store.ts                # AsyncStorage load-or-seed, persist, reset
    api.ts                  # the mock service layer (the only file a backend touches)
  lib/
    theme.ts                # colour, type, spacing, radius, shadow tokens
    geo.ts                  # [lon,lat] ⇄ {latitude,longitude}, fitting, area, parsing
    util.ts                 # riskLevelOf / healthClassOf / ndviColor / formatters
    useAsync.ts             # loading/data/reload hook, mirrors the web app
    session.tsx             # farmer session context
  types.ts                  # domain types — identical field names to the web app
```

### Coordinates

The data model stores **`[longitude, latitude]`** (matching the web app and GeoJSON);
`react-native-maps` speaks `{ latitude, longitude }`. Every conversion goes through
`src/lib/geo.ts` — don't index the tuples by hand elsewhere.

---

## Design system

Tokens live in `src/lib/theme.ts` and mirror the admin web panel exactly.

| Token | Hex | Use |
|---|---|---|
| `accent` | `#2f7d32` | primary green — buttons, active states |
| `accentDark` | `#235e26` | pressed / emphasis |
| `accentSoft` | `#e6f2e6` | active tab pill, "Active" badge |
| `ink` | `#1c2a1d` | primary text (use `ink(opacity)` for secondary) |
| `mist` | `#f6f8f5` | app background |
| `line` | `#e3e9e1` | borders and dividers |

Status: pending `#fef3c7`/`#92400e` · active `#e6f2e6`/`#235e26` · rejected `#fee2e2`/`#b91c1c`.
Risk: Low green, Moderate amber, High red. NDVI uses the web app's six-stop ramp
(`ndviColor` in `src/lib/util.ts`).

**Type** — Space Grotesk for titles and numbers, IBM Plex Sans for body and labels. Both
load per-weight in `app/_layout.tsx`; importing from the package root would bundle every
weight (~10 MB of fonts).

**Shape** — 16px cards, 12px controls, white surfaces on mist, soft `line` borders, and
small uppercase eyebrow labels with wide tracking.

Icons are hand-rolled SVGs in `src/components/Icons.tsx` (24×24, 1.8 stroke) so they sit
at the same visual weight as the body text.

---

## Maps

`react-native-maps` renders a **hybrid (satellite) map** with the boundary polygon filled
by `ndviColor(latestNdvi)`. It works in Expo Go with no extra setup. For a production
build with Google Maps on iOS, add an API key via the `react-native-maps` config plugin in
`app.json`.

`FarmMap` loads the native module lazily. Where it isn't available — the web preview, or a
build without the native view — it falls back to a **coordinate grid** that projects the
same `[lon, lat]` data, supports tap-to-add and zoom, and feeds the identical submission
payload. The data flow is the same on both paths; only the imagery differs.

---

## Shipping a standalone APK

The EAS project is `@waleed249/corpsat` (`extra.eas.projectId` in `app.json`).

```bash
eas login                                          # once, --browser for Google sign-in
eas build --platform android --profile preview     # → downloadable .apk
```

The **`preview`** profile in `eas.json` is the shareable one: `distribution: internal`
plus `buildType: apk` gives a single file anyone can sideload after allowing
"install from unknown sources". The **`production`** profile builds an `.aab`, which
is Play Store only and **cannot** be installed directly — don't send that one.

Run it **from this directory**. Running `eas build` from a folder without the app config
makes EAS scaffold a throwaway project and try to upload whatever directory you're in.

The first build generates an Android keystore; let EAS manage it — every future build of
this app must be signed with the same one. `eas build:list` retrieves the download link
afterwards, and every build is listed at
[expo.dev/accounts/waleed249/projects/corpsat](https://expo.dev/accounts/waleed249/projects/corpsat/builds).

Building locally instead needs **JDK 17+** (`expo prebuild && cd android && ./gradlew
assembleRelease`). Java 8 will not work with React Native 0.86 / AGP 8.

### Installing the APK on a phone

Send the recipient the **Application Archive URL** from the build (it ends in `.apk`).

1. Open the link **on the Android phone** — Chrome will warn about the file type; choose
   **Download anyway**.
2. Tap the downloaded file. Android asks to allow installs from this source: allow it for
   Chrome (or your Files app), then go back and tap **Install**.
3. Play Protect may say *"Unsafe app blocked"* because the app isn't from the Play Store.
   Tap **More details → Install anyway**. This is expected for any sideloaded build and
   not a sign anything is wrong.

Nothing else is needed — no Expo Go, no dev server, no account.

**iOS cannot be sideloaded this way.** Distributing to an iPhone needs an Apple Developer
account and TestFlight (`eas build --platform ios --profile preview` plus
`eas submit --platform ios`).

### Running it as a test app instead of a standalone build

A standalone APK is the right choice for a demo, but it's frozen at build time — every
change means a new build. These alternatives trade that for faster iteration:

| Option | Needs a build? | Dev server? | Good for |
|---|---|---|---|
| Expo Go | No | Yes | Showing someone a change right now |
| Development build | Once | Yes | Ongoing development on a real device |
| Internal distribution APK | Every change | No | Handing to a non-technical tester |
| Play Store internal testing | Every change | No | A real tester group with auto-updates |
| EAS Update | Once | No | Shipping JS-only fixes to existing installs |

**Expo Go** — no build at all. The tester installs Expo Go from the Play Store, you run
`npx expo start` and they scan the QR code. Add `--tunnel` if you're not on the same
network. Maps work here even without your own key, because Expo Go carries Expo's. The
catch: it only runs while your machine is serving the project.

**Development build** — `eas build --platform android --profile development` produces a
dev client APK. It behaves like Expo Go but includes this project's own native config, so
what you test matches what ships. Install it once, then `npx expo start --dev-client`
and it connects to your Metro server with fast refresh intact.

**Play Store internal testing** — the closest thing to a real test app. Needs a Google
Play Developer account (one-off $25 fee). Build the app bundle and submit it:

```bash
eas build --platform android --profile production   # produces .aab
eas submit --platform android --profile production
```

Then in Play Console create an **Internal testing** release and add tester emails (up to
100). They install from the Play Store, get updates automatically, and see none of the
unknown-sources warnings above.

**EAS Update** — pushes JS and asset changes to already-installed builds without a
rebuild. Not wired up yet; `expo-updates` is not currently a dependency. To enable it:

```bash
npx expo install expo-updates
eas update:configure
eas build --platform android --profile preview      # one more build to embed the client
```

After that, `eas update --branch preview` reaches every install of that build. Changes to
native config — a new package, the Maps key, permissions — still require a rebuild.

### Adding Google Maps to the APK

Standalone Android builds have no Maps key of their own — Expo Go borrows Expo's, which
is why maps work in development but the tiles come up blank in a built APK. Everything
else (drawing a boundary, submitting, health scores, persistence) is unaffected, and the
boundary polygon still draws over the blank canvas.

To fix it:

1. In Google Cloud Console, enable **Maps SDK for Android** and create an API key.
2. Restrict the key to package `com.cropsat.farmer` and the SHA-1 that
   `eas credentials` prints for this project.
3. Store it and rebuild:

```bash
eas env:create --name GOOGLE_MAPS_API_KEY --value <key> --environment preview
eas build --platform android --profile preview
```

`app.config.js` reads `GOOGLE_MAPS_API_KEY` from the environment and only then adds the
`react-native-maps` config plugin. The key is deliberately not committed — this repo is
public. For a local build, put it in `.env.local` instead.

## Mock data

Seeded on first launch and persisted to AsyncStorage under `cropsat.mobile.store.v1`
(session under `cropsat.mobile.session.v1`). **Profile → Reset demo data** re-seeds.

Seed contents:

- **Yousif Ibrahim** — `+249 900 000 000`, Gedaref, login enabled.
- **North Gedaref Block** — active, ~450 acres, sorghum, 9 snapshots on a seasonal NDVI
  curve so the health score and colours look real.
- **Wadi El Hawad Field** — submitted 3 days ago, so the pending-review UI is visible
  immediately. No snapshots — monitoring begins after approval.
- **Amna Hassan** — `+249 911 222 333`, `canLogin: false`, for the blocked-login path.

Real Sudan coordinates are used throughout: Gedaref `[35.38, 14.03]`,
Sennar `[33.62, 13.55]`, Khartoum `[32.55, 15.5]`.

---

## Swapping in a real backend

`src/services/api.ts` is the seam. Replace the bodies, keep the signatures:

```ts
requestOtp(phone): Promise<{ sent: boolean }>
verifyOtp(phone, code): Promise<FarmerSession>
getSession(): FarmerSession | null
logout(): Promise<void>

getMyFarms(): Promise<Farm[]>
getFarm(id): Promise<Farm | null>
getSnapshots(farmId): Promise<Snapshot[]>
getLatestNdvi(farmIds): Promise<Record<string, number>>
createFarmSubmission(input: NewFarmInput): Promise<Farm>
```

No screen imports `store.ts` or `seed.ts` directly, and the field names in `src/types.ts`
match the web app's `types.ts`, so a shared Postgres/Supabase schema drops straight in.
Auth already assumes phone-as-identity, which is what real phone OTP will give you.

`mockApprove` and `resetDemoData` are demo-only and go away with the mock layer.
