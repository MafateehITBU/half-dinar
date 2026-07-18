# Contributing — Abu Al-Nas

## Workflow
1. Read `PROJECT_MEMORY.md` before starting work
2. Branch from `main`: `feature/`, `fix/`, `chore/`
3. Match existing code style (TypeScript strict, Prettier)
4. Update `PROJECT_MEMORY.md` and `CHANGELOG.md` after major tasks
5. Add/update API docs for new endpoints

## Code standards
- SOLID, DRY, KISS
- No duplicate validators — use `packages/shared`
- Every admin mutation → audit log consideration
- i18n: always both `ar` and `en` fields for user-facing content

## Commits
- Conventional style: `feat:`, `fix:`, `docs:`, `chore:`
- Small focused PRs preferred

## Testing
- Run `npm test` in affected app before PR
- Critical paths: auth, checkout COD, coupon validation, stock decrement

## Questions
- Business rules → check `PROJECT_MEMORY.md` Business Rules section
- Architecture → `ARCHITECTURE.md`
