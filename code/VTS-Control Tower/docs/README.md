# VTS Control Tower Docs

This is the single documentation hub for the full VTS workspace.

Use these folders:

- [architecture](architecture): system overview, repository layout, data model, and event flow
- [contracts](contracts): backend, frontend, firmware, simulator, and messaging contracts
- [operations](operations): Docker, local testing, installation, debugging, and lifecycle guides
- [development](development): performance and Codex engineering rules
- [reference](reference): backend reference docs and archived legacy notes

## Suggested Reading Order

Start here if you are new:

1. [architecture/00-overview.md](architecture/00-overview.md)
2. [architecture/01-architecture.md](architecture/01-architecture.md)
3. [contracts/03-messaging-spec.md](contracts/03-messaging-spec.md)
4. [operations/local-testing-guide.md](operations/local-testing-guide.md)
5. [operations/docker-guide.md](operations/docker-guide.md)

## What Was Cleaned Up

- Root-level operational guides were moved into `docs/operations`
- Old Control Tower legacy files were moved into `docs/reference/legacy`
- Backend markdown docs were consolidated into `docs/reference/backend`
- Duplicate backend markdown files were removed instead of keeping overlapping copies

## Source Of Truth

For cross-project behavior, this `docs` tree is now the source of truth.

Small repo-level README files may still exist for quick start notes, but detailed project documentation should live here.
