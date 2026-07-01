# Agent Instructions

## Token-Saving Shell Usage

Always prefix shell commands with `rtk` when working in this repository.

Examples:

```powershell
rtk git status
rtk git diff
rtk proxy node tools/smoke-test.js
rtk proxy powershell.exe -NoProfile -Command "Get-ChildItem"
```

If `rtk` has no native filter for a command, use `rtk proxy <command>`.
Use raw commands only when debugging `rtk` itself or when `rtk proxy` breaks command quoting.

## DCP Usage

This repository is commonly used with DCP enabled.

- Keep closed work easy to compress: preserve final decisions, touched files, and verification outcomes clearly.
- Prefer finishing one thread end-to-end before starting another so DCP can prune older context safely.
