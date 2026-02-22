---
name: deploying-changes
description: "Streamlines the git commit, push, and Vercel deploy workflow for ARYCP. Handles staging, committing, pushing, and verifying the deployment. Use when the user says 'push', 'deploy', 'push to production', 'make it live', 'subelo', or 'haz push'."
---

# Deploy Assistant

Streamlined commit → push → deploy workflow for ARYCP ERP.

## When to use this skill
- User wants to push code and deploy
- User says "push", "deploy", "make it live", "subelo", "haz push"
- After completing a feature or fix, ready to go live

## Workflow

### 1. Pre-Deploy Check
Before any push, verify:
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors in the build output
- [ ] No unintended files staged (check `.env` files, `node_modules`, etc.)

### 2. Stage & Commit
```bash
# Check what's changed
git status -sb
git diff --stat

# Stage changes (review list with user first)
git add <files>

# Commit with descriptive message
git commit -m "feat: descriptive message"
```

**Commit message conventions:**
- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code restructuring
- `style:` — UI/CSS changes
- `docs:` — Documentation updates
- `chore:` — Maintenance tasks

### 3. Push to GitHub
```bash
git push origin main
```

### 4. Verify Deployment
- Vercel auto-deploys on push to `main`
- Check Vercel dashboard or wait ~60 seconds
- Confirm the deploy at the production URL

### 5. Post-Deploy
- Notify the user with the deploy status
- If deploy failed, check build logs and troubleshoot
- Confirm the changes are live

## Error Recovery

### Push Rejected
```bash
# If remote has new changes
git pull --rebase origin main
# Resolve conflicts if any, then push again
git push origin main
```

### Build Fails on Vercel
- Check the Vercel build logs
- Common issues: missing env vars, TypeScript errors, import issues
- Fix locally, commit, and push again

### Wrong Commit
```bash
# Undo last commit (keep changes staged)
git reset --soft HEAD~1
# Fix and recommit
```

## Key Principles

- **Build before push** — Never push code that doesn't compile
- **Descriptive commits** — Future you will thank present you
- **One feature per push** — Keep deploys focused and reversible
- **Verify after deploy** — Always confirm it's working in production
