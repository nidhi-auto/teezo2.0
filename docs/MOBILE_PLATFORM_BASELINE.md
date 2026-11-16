# Player mobile — platform support baseline

Approved stakeholder policy for Teezo 2.0 (Backlog **#192** define / **#207** accept for
implementation / **#228** mobile delivery planning). Machine-readable copy:
[`mobile/platform-baseline.json`](../mobile/platform-baseline.json).

The Player native app targets **iOS 15.1+** and **Android 10 (API 29)+**. Club Admin and Super
Admin mobile clients remain out of scope.

---

## Supported platforms

| Platform | Supported for Player app |
| --- | --- |
| **iOS** | **Yes** — minimum **15.1** |
| **Android** | **Yes** — minimum **10 / API 29** |

---

## Build and test scope

| Concern | Requirement |
| --- | --- |
| iOS deployment target | **15.1** (or toolchain equivalent enforcing ≥ 15.1) |
| Android `minSdkVersion` | **29** |
| Automated tests | Simulators/emulators at or above these floors |
| Unsupported OS | No QA or hotfix obligation below minimum versions |

When the Expo / React Native project is added under `mobile/`, wire `ios.deploymentTarget` and
`android.minSdkVersion` from `platform-baseline.json` into native project config.

---

## Revision

| Date | Change |
| --- | --- |
| 2026-11-02 | Initial approved baseline (#192): iOS 15.1+; Android API 29+; Player only |