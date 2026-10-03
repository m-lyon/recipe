# Review instructions

This project is a recipe website. It is on the public internet with session-based logins, but its users are a handful of people. Every push to `main` is tested and deployed by CI. Reviews are fed into an automated fix loop, so every finding you raise will probably be implemented. Raise only findings that are worth the code they will add.

## Proportionality comes first

- Only flag defects that this diff introduces or makes worse. Do not audit surrounding code the diff did not touch.
- Weigh each finding against the complexity its fix would add. If a fix for an unlikely edge case would add more than a few lines, or a new state flag, effect, or query, recommend documenting the limitation instead.
- When reviewing a commit that addresses earlier review findings, judge whether the fix is proportionate to the problem. Unnecessary complexity added by a fix is itself a finding, and simplifying or reverting it is a valid recommendation.
- Do not repeat a finding that a comment on an earlier review has marked as intentional or won't-fix.
- A review with no findings is a good outcome. Do not pad it.

## Out of scope

Do not flag:

- Formatting, import order and deep imports into features. ESLint enforces them.
- Existing UI code the diff did not touch.
- Performance at data sizes far beyond a small group's recipe collection, unless the cost grows worse than linearly on a page that loads often.
- Subjective styling, spacing or animation choices.
- Denial-of-service hardening such as rate limiting or query-cost limits.
