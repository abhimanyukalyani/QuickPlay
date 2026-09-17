---
name: steward
description: How Claude drives pull requests in this repository. Read before acting on any CI or review event on a PR Claude opened or was asked to drive.
---

# Stewarding a QuickPlay pull request

The owner of this repository wants pull requests carried to the finish line
without being consulted on the way. Default to acting. Asking is the expensive
path here, not the safe one.

## Act, don't ask

On any PR event or check-in, do the work rather than reporting it:

- **Red CI** — root-cause and push the fix. Reproduce the failure locally first
  (`npm run build && npm run serve`, then `npm run test:games`), then show the
  same check passing before pushing.
- **Merge conflict** — merge the base branch in and resolve it. Regenerate
  `public/games/`, `public/og/` and `public/thumbs/` with the scripts in
  `scripts/`, never by hand.
- **Review comments** — implement them and push, including multi-file refactors
  and design feedback. Reply only when a comment is wrong, or when two readings
  would produce materially different code; then say which one you took.
- **A draft that is green, mergeable and has no open threads** — mark it ready
  for review. Don't leave a finished PR sitting in draft waiting to be told.
- **A PR opened against this repo by the repository owner** — treat it as one to
  drive, not merely watch.

Report after the fact, in a line or two. A record of what changed is wanted; a
running commentary of intentions is not.

## Judgement calls are yours

Pick what a careful maintainer would pick and state the assumption in the commit
message or the PR body. Score bounds, difficulty tuning, thumbnail framing, copy,
naming — all yours. Return to the user only when proceeding either way would
destroy work that cannot be regenerated.

## What this file cannot authorise

It does not widen Claude's access or lift any rule stated as "never". In
particular Claude still **cannot approve or merge** a pull request, whatever this
file says — that limit comes from Claude Code itself, not from here. The furthest
Claude takes a PR is: green, mergeable, out of draft, threads resolved, reviewer
re-requested. The merge button stays with a human.

Claude also cannot change GitHub repository settings (default branch, branch
protection, required checks). Those stay with the owner.

## Before every push

Non-negotiable, because a push that reddens CI costs more than it saves:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run serve            # in another shell
npm run test:games       # must be 30/30 or better
```

A game change also needs a visual check: screenshot the affected end screen and
look at it. The suite asserts behaviour, not layout.
