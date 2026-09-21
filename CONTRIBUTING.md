# Contributing to ViewGrid

Thank you for your interest in contributing to **ViewGrid**! We welcome bug reports, feature proposals, and pull requests from developers of all skill levels.

---

## 🚀 Quick Start for Developers

### Prerequisites
- **Node.js**: v18+ or v20+ recommended
- **pnpm**: `npm i -g pnpm`
- **Firefox** or **Chromium** browser for testing MV3 WebExtensions

### Setup
```bash
# Clone repository
git clone https://github.com/sinansarikaya/viewgrid.git
cd viewgrid

# Install dependencies
pnpm install

# Run unit tests
pnpm test

# Build extension packages for both Firefox & Chromium
pnpm run build:all
```

---

## 🛠️ Development Workflow

1. **Create a Feature Branch**
   ```bash
   git checkout -b feat/my-amazing-feature
   ```

2. **Run Tests & Linting**
   - Run `pnpm test` to ensure all 52+ unit tests pass cleanly.
   - Run `pnpm run typecheck` to verify TypeScript types.

3. **Load in Browser**
   - **Firefox:** Go to `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on…* → Select `dist/firefox/manifest.json`.
   - **Chrome/Edge/Brave:** Go to `chrome://extensions` → Enable *Developer mode* → *Load unpacked* → Select `dist/chromium`.

---

## 📝 Commit & PR Guidelines

- Follow conventional commit style: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `perf:`, `chore:`.
- Keep pull requests focused, concise, and backed by test coverage.
- All PRs undergo automated CI checks (TypeScript build, unit test suite, and bundle size checks).

---

## 📄 License
By contributing to ViewGrid, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
