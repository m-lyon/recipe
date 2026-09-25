# Review instructions

Recipe is a small recipe website: an Express + Apollo GraphQL API over MongoDB
(`api/`) and a React SPA (`client/`). It is on the public internet with
session-based logins, but its users are a handful of people. Every push to
`main` is tested and deployed by CI. Reviews are fed into an automated fix loop,
so every finding you raise will probably be implemented. Raise only findings
that are worth the code they will add.

## Proportionality comes first

- Only flag defects that this diff introduces or makes worse. Do not audit
  surrounding code the diff did not touch.
- Weigh each finding against the complexity its fix would add. If a fix for an
  unlikely edge case would add more than a few lines, or a new state flag,
  effect, or query, recommend documenting the limitation instead.
- When reviewing a commit that addresses earlier review findings, judge whether
  the fix is proportionate to the problem. Unnecessary complexity added by a fix
  is itself a finding, and simplifying or reverting it is a valid
  recommendation.
- Do not raise a new edge case inside code that exists only to handle another
  edge case, unless it loses data, breaks a page, or weakens access control.
- Do not repeat a finding that a comment on an earlier review has marked as
  intentional or won't-fix.
- A review with no findings is a good outcome. Do not pad it.

## Out of scope

Do not flag:

- Formatting, import order and deep imports into features. ESLint enforces
  them.
- Existing Chakra UI code the diff did not touch. New UI should prefer Mantine,
  but the migration happens gradually.
- Performance at data sizes far beyond a small group's recipe collection, unless
  the cost grows worse than linearly on a page that loads often.
- Subjective styling, spacing or animation choices.
- Denial-of-service hardening such as rate limiting or query-cost limits.
- The known failing `EditableIngredient.browser.test.tsx`.

## Worth flagging

- **Access control.** This is the one area where thoroughness is always worth
  it. Every new or renamed mutation, and any auto-CRUD resolver newly exposed
  from graphql-compose, must be wrapped with the right guard (`isAdmin`,
  `isVerified`, `isDocumentOwnerOrAdmin`) in `api/src/schema/index.ts`. Flag
  resolvers that let one user read or change another user's data, and user
  input passed into Mongo filters where it could carry query operators.
- **Uploads and file paths.** Changes to `api/src/routes/uploads.ts` or image
  handling must not let a request read or write outside the image directory or
  store unvalidated files.
- **Schema changes without a migration.** A Mongoose model change that existing
  documents won't satisfy needs a script in `api/src/scripts/` like the existing
  `updateSchema_*.js` files, because deploys happen automatically.
- **Stale client cache.** A mutation that changes data already in the Apollo
  cache must update it (usually `cache.modify`). Router navigation does not
  refetch, so the page would show old data.
- **Mocks out of step with queries.** A field added to a query or mutation must
  be added to every object in its `__mocks__` file.
- **Tests weaker than their name.** Ask whether a regression in the behaviour a
  test names would still pass it.
- **Comments and docs that contradict the code,** including `AGENTS.md`.
  Comment mistakes are fine to report at Low.
