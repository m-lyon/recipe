# AGENTS.md — recipe-cli

Guidance for an AI agent using the `recipe` CLI to link USDA food items to ingredients.

Read [README.md](README.md) for installation, configuration and the full command reference.
This document is the workflow and the judgement rules.

## Canonical workflow

```text
1. recipe auth status                                    confirm admin role
   (no login step: commands authenticate themselves)
2. recipe recipes show <identifier> --json               find gaps
3. for each ingredient marked missing:
     recipe usda search "<name>" --json                  candidates
     recipe usda show <fdcId> --json                     macros and portions
     recipe nutrition link <id> --fdc-id <n> \
       [--portion "<label>"] [--set-density] --dry-run   plan
4. review the planned writes
5. re-run step 3 without --dry-run
6. recipe nutrition status --recipe <identifier>         confirm coverage

Exit code 5 means the ingredient already has data. Do NOT add --overwrite on your
own. Report it and let the operator decide, because that data may have been
entered by hand.
```

`recipe ingredients list --missing-nutrition --json` is the entry point for a run across the
whole database rather than one recipe.

## Judgement rules

These are not style advice. Each one was derived from a real error found while sampling the
USDA API, recorded in `spec-usda-portions.md`.

### Choosing the record — this matters more than choosing the portion

- Read the full description before accepting a hit. Sampling found `chicken breast meat only
  raw` returning **Pheasant, breast** and `lemons raw` returning **Lemon juice, raw**.
- Watch for qualifiers that change the size of the thing. *Squash, zucchini, **baby**, raw*
  gives `1 large = 16 g`; the ordinary record gives `323 g`. A twentyfold error, invisible in
  the portion data.
- Prefer Foundation and SR Legacy over Branded for generic ingredients. The `TYPE` column in
  `usda search` and the heading of `usda show` carry the data type.
- Match the preparation state: raw against raw, cooked against cooked.

### Choosing the portion

- Only `kind: ITEM` portions can supply `perUnit`. The CLI refuses the others with exit 6, so
  do not try to force one through.
- Roughly a third of foods offer no `ITEM` portion at all. When that happens, look for a
  better record before giving up. If none exists, link `perGram` only and report the
  ingredient as needing manual per-unit entry. **Do not invent a gram weight.**
- The `ambiguous` flag means read the label carefully. `NLEA serving`, `1 lemon yields` and
  `slice` all count like items and are not one whole item.
- When several sizes exist — egg spans 38 g to 63 g, onion 70 g to 150 g — pick the one a
  recipe writer would mean, usually medium or large. **State which you picked.**

### Density

- `--set-density` writes `Ingredient.density`, a field on a different document from the one
  the link creates. Only pass it when the operator asked for it.
- A density can only come from a `VOLUME` portion. The CLI picks the largest volume portion
  on the record, because a cup is measured with less rounding error than a teaspoon, and it
  warns when the record's volume portions disagree.
- An ambiguous label such as `cup, chopped` describes a packing density rather than a true
  density. The CLI refuses it unless `--allow-ambiguous-density` is also given.

## The USDA cache

`usdaFoodItem` responses are cached on disk, so re-reading a record you already fetched is
free and does not touch the quota. Fetch a candidate as often as you find useful.

- Repeating `usda show <fdcId>` costs nothing after the first call.
- A dry run and the write that follows reuse the record `usda show` fetched.
- Pass `--refresh` only when you have reason to think the record changed.
- `usda search` is not cached, so do not repeat a search you have already run. Keep its
  results in your own working notes.

The quota is 1000 requests per hour for the whole server. Budget roughly one upstream call
per ingredient, plus one per search.

## Reading the output

Every command accepts `--json` and then prints one object and nothing else. Parse that;
never parse the tables.

```json
{ "ok": true, "data": {}, "warnings": [] }
{ "ok": false, "error": { "code": "WOULD_OVERWRITE", "message": "...", "existing": {} } }
```

`warnings` is where the CLI tells you something is incomplete but not wrong — a countable
ingredient linked without a `perUnit`, a portion flagged ambiguous, a USDA record missing a
macro. Report them; do not discard them.

## Exit codes worth branching on

| Code | Meaning | What to do |
| --- | --- | --- |
| 3 | not authenticated, or the wrong role | stop; the account needs to be an admin |
| 4 | not found, or an ambiguous identifier | the error lists the candidates; pick an id |
| 5 | existing data would be replaced | **stop and report**; do not add `--overwrite` |
| 6 | the write was rejected | a non-item portion, or server validation; re-plan |

Exit 5 and exit 6 are deliberately separate. Exit 6 may be worth retrying with different
arguments. Exit 5 is a decision for a person.
