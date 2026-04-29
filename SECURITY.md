# Security Policy

This project has automated security tooling configured:

- **Dependabot** — weekly auto-PRs for vulnerable deps
- **GitHub Actions** — `npm audit` + `gitleaks` on every PR
- **ESLint security plugin** — flags unsafe patterns in code review
- **Pre-commit gitleaks** (if husky installed) — blocks commits with secrets

## Reporting vulnerabilities

Email: valentintoledo970@gmail.com

## Manual scan

```bash
npm run security:scan
```

## Setup notes for new contributors

1. `npm install` — installs everything including security plugins
2. (Optional) `npm install -g gitleaks` — enables local pre-commit scan
3. (Optional) `npm install -D husky && npx husky init` — enables pre-commit hooks
