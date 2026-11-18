# Interview notes — mobile-app (Expo)

> **Be honest about scope.** The `src/` code is still the `create-expo-app`
> starter (Home + Explore tabs, themed components, animated splash). What you
> actually built is the dev workflow around it (`Makefile`) and the demo/build
> setup (`eas.json`, tunnel). Pitch it as "my Expo playground to learn the
> stack". Don't claim features that aren't there. If you add a real screen
> tonight, update the pitch.

## 2-minute pitch

**What:** A cross-platform mobile app built with Expo SDK 58 and React Native
0.88. The same TypeScript codebase runs on Android, iOS and web. Right now
it's my sandbox for learning the stack your team uses before I start building
features on it.

**Who it's for:** Me, as a learning project. The goal is to get comfortable
with the Expo workflow end to end: routing, native tabs, theming, running on a
real device and shipping an installable build.

**My role:** Solo. I generated the project with `create-expo-app`, studied
how it's put together, and built the tooling around it:
- a `make up` target that connects my Android phone over wireless ADB
  (it switches a USB-connected phone to TCP/IP once, then `adb reverse`s
  port 8081 so Metro is reachable on `localhost`, then opens Expo Go
  automatically);
- a `make demo` target that serves the app through an ngrok tunnel, so it
  works on any network, even a phone hotspot;
- an EAS `preview` profile that produces a sideloadable APK.

**Stack:** Expo SDK 58 · React Native 0.88 · React 19 with the React Compiler
enabled · TypeScript · Expo Router (file-based routing in `src/app`, typed
routes, `NativeTabs` for real platform tab bars) · EAS Build.

## One technical choice and why

**Expo Router + Continuous Native Generation instead of a bare React Native
project.**
- Routes are just files in `src/app/` (`index.tsx`, `explore.tsx`), and
  `_layout.tsx` defines the navigator. No manual navigation config to keep in sync.
- There are no `android/` or `ios/` folders in git. Native config lives in
  `app.json` and config plugins (e.g. `expo-splash-screen`, `expo-web-browser`),
  and EAS generates the native projects at build time. That means fewer merge
  conflicts and SDK upgrades become mostly `npx expo install --fix`.
- Platform-specific files (`app-tabs.tsx` vs `app-tabs.web.tsx`,
  `use-color-scheme.web.ts`) let the web build use different implementations
  without `if (Platform.OS === …)` scattered through components.

## One problem I solved

**Running the app on my phone without a cable, and later without shared Wi-Fi.**
1. *Cable-free on home Wi-Fi:* With plain `expo start`, the phone has to reach
   the laptop's LAN IP, and that breaks with firewalls or IP changes. In the
   `Makefile` I use wireless ADB plus `adb reverse tcp:8081 tcp:8081`, so the
   phone talks to `localhost:8081` and the LAN IP doesn't matter. Metro starts
   with `--localhost`, and the script waits on `/status` before launching Expo Go.
2. *No shared network (interview demo over hotspot):* `npx expo start --tunnel`
   in SDK 58 needs an Expo account login for its signed tunnel. I hit
   `Couldn't create a signed tunnel URL`. The fix was installing `@expo/ngrok`
   and using `--tunnel ngrok` (`make demo`). For a fully offline-safe demo
   I also set up an EAS `preview` profile that builds a standalone APK.

## What I'd improve

- **Build real features.** For example a Supabase-backed screen (auth + one
  table with row-level security), which matches how your team works.
- **Fix the template's warnings:** `npx tsc --noEmit` reports a `ref` type
  error in `src/components/app-tabs.web.tsx`, and `npx expo lint` flags
  `setState` inside an effect in `src/hooks/use-color-scheme.web.ts`. Both are
  web-only, so the phone demo is unaffected.
- **Add tests:** Jest via `jest-expo` + React Native Testing Library for
  components, and Maestro for an E2E smoke flow.
- **CI:** run lint, typecheck and `expo-doctor` on every PR, plus EAS Update for
  over-the-air JS fixes.
