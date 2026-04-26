<p align="center">
  <img src="app/assets/icon.png" alt="Tempo" width="160" />
</p>

<h1 align="center">Tempo</h1>

<p align="center">
  <strong>Repeating alarms with real intensity control.</strong><br>
  <sub>From a whisper to a full call. Local-first. Open source.</sub>
</p>

<p align="center">
  <a href="https://github.com/giacomoguidotto/tempo/actions"><img src="https://github.com/giacomoguidotto/tempo/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://biomejs.dev"><img src="https://img.shields.io/badge/biome-formatted-blue" alt="Biome"></a>
  <a href="https://expo.dev"><img src="https://img.shields.io/badge/expo-SDK%2055-000020?logo=expo" alt="Expo SDK 55"></a>
</p>

<br>

Most reminder apps send you a notification and hope you notice. Tempo gives you a dial. Four intensity levels so every alarm hits exactly as hard as it should.

<p align="center">
  <img src="docs/play-store/screenshots/rhythm-list-with-countdown.jpg" alt="Home screen with VU meter" width="200" />
  &nbsp;&nbsp;
  <img src="docs/play-store/screenshots/edit-rhythm-schedule.jpg" alt="Edit rhythm" width="200" />
  &nbsp;&nbsp;
  <img src="docs/play-store/screenshots/full-screen-alarm.jpg" alt="Full-screen alarm" width="200" />
</p>

## 🚀 Get Started

<a href="https://play.google.com/store/apps/details?id=dev.guidotto.tempo"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" height="80"></a>

...or download the APK from [GitHub Releases](https://github.com/giacomoguidotto/tempo/releases)!

## ✨ Features

- **Rhythms, not one-off alarms.** Set the days, time window, and interval. Tempo repeats it for you.
- **Four intensity levels.** From a silent vibration (Whisper) to a persistent alarm you must dismiss (Call).
- **A live VU meter.** See your next beat approaching in real time on the home screen.
- **Alarms that actually fire.** Exact Android alarms, foreground services, battery-optimization bypasses. Survives Doze mode, app kills, and device restarts.
- **No accounts. No cloud. No ads.** Your data stays on your device. Nothing leaves your phone.

## 🔍 Under the Hood

Tempo is built with [Expo](https://expo.dev) and [React Native](https://reactnative.dev). Alarms are powered by [Notifee](https://notifee.app) with exact scheduling, foreground services, and full-screen intents for high-intensity levels. All data is stored locally using SQLite (via [Drizzle](https://orm.drizzle.team)) and [MMKV](https://github.com/mrousavy/react-native-mmkv).

Free and open source. See [CONTRIBUTING.md](.github/CONTRIBUTING.md) to get involved.
