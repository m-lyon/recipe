# AGENTS.md — recipe-cli

Guidance for an AI agent using the `recipe` CLI to link nutritional data to ingredients: USDA
food items for generic foods, and Open Food Facts products for branded ones.

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
       [--portion "<label>"]... --dry-run                plan
4. review the planned writes
5. re-run step 3 without --dry-run
6. recipe nutrition status --recipe <identifier>         confirm calculable rows
7. recipe nutrition <identifier>                         the totals, including recipes
                                                         used as ingredients

Exit code 5 means the ingredient already has data. Do NOT add --overwrite on your
own. Report it and let the operator decide, because that data may have been
entered by hand.
```

`recipe ingredients list --missing-nutrition --json` is the entry point for a run across the
whole database rather than one recipe.

A recipe used as an ingredient counts through its **yield**: "300 g Pearl Couscous"
needs Pearl Couscous to record how much one recipe makes, in grams. `recipe nutrition` names a
missing yield (`NO_YIELD`). A yield is set in the recipe editor; the CLI does not set it. Report
it to the operator.

## Branded products: Open Food Facts

USDA's branded data is US-only. For a branded product the operator buys (a stock pot, a
seitan, a pack of pearl couscous), link the Open Food Facts product by its barcode instead.

```text
1. The operator sends photos (barcode, nutrition label, front of pack) or the digits.
2. Decode a barcode photo:   zbarimg --quiet --raw <photo>
   If zbarimg finds nothing, read the digits printed under the bars.
3. recipe open-food-facts show <barcode> --json                     product, macros, portions
4. Compare the per-100 g values with the label photo.
5. recipe nutrition link <id> --barcode <code> \
     [--portion <n>]... --dry-run                       plan
6. review, then re-run step 5 without --dry-run
```

- **Prefer a barcode to a name search.** `open-food-facts search` is imprecise and the server allows
  8 searches a minute. Use it only when the operator has no barcode, and confirm the pick.
- **Check the label.** Volunteers enter this data. When a label photo is available, compare
  kcal, protein, carbs and fat per 100 g. A value that differs is a stop-and-report
  condition: tell the operator what differs, and do not link it as it is.
- **A data warning is a stop-and-report condition** too: a missing macro, or kcal that the
  macros do not explain.
- **When the operator approves, link with the label values.** `--label-per-100g
  kcal,protein,carbs,fat` writes the values read from the label photo in place of the
  record's. The barcode and the portions still come from the record. Read the four values
  from the photo yourself and quote them to the operator; never type values you have not
  seen. The dry run shows the label beside the record and marks each difference. A
  re-link without the flag replaces the label values with the record's.
- A check-digit warning usually means a misread digit. Re-read the photo before you look
  the code up.
- Check the brand and the pack size in `open-food-facts show` against the photo. Two products often
  share a name.
- A multipack ("8×24 g") gives a `1 each` portion of one item. A serving is not always one
  item: a Knorr stock pot record gives a 28 g serving for a 24 g pot, so it is flagged
  ambiguous. Prefer the multipack portion, or a weight from the label, read by the operator.
- When a product is missing from Open Food Facts, say so. Do not fall back to a USDA
  branded record for a UK product without asking.

## Contributing back to Open Food Facts

`recipe open-food-facts contribute <barcode>` sends a correction, or a missing product, to
Open Food Facts. **This writes to a public database that other people rely on.**

```text
1. Read the values from the operator's label photo. Quote them to the operator.
2. recipe open-food-facts contribute <barcode> \
     --label-per-100g kcal,protein,carbs,fat \
     [--name "..."] [--brands "..."] [--quantity "4 x 26 g"] \
     --photo <label photo> --dry-run                    plan: current values beside new ones
3. Show the plan to the operator. Send only after the operator approves it.
4. Re-run step 2 without --dry-run.
5. Link the ingredient as a separate step: nutrition link --barcode <code>.
```

- **Never send a value you have not read from a label photo**, and never send without the
  operator's approval of that exact plan.
- **Attach the label photo** with `--photo` whenever you have one. Volunteers check edits
  against the photo; an edit without one is more likely to be reverted.
- Send only the fields that the label shows. Do not send a name, a brand or a pack size you
  inferred.
- **Send values on the label's basis.** When the label gives values per 100 ml, pass them
  with `--label-per-100ml`, as printed. Do not convert them to 100 g with a density, even one
  the operator weighed: volunteers compare the values with the photo. (`nutrition link
  --label-per-100g` is different: our data is per gram, so there a per-100 ml label needs the
  operator's weight of a known volume.)
- A missing product needs `--name`, so that others can find it.
- The server sends contributions to the **staging** server unless production is
  configured. The result names the host, and the CLI warns when it was staging. Tell the
  operator which one it was.
- A contribution does not change our nutritional data. After it, `nutrition link` reads the
  product fresh. A contribution to staging does not change what `open-food-facts show`
  reads, because reads come from production.

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
- **Search many times.** USDA search quality is poor: one query often returns the wrong food, or
  only branded records. For each ingredient, run 5 or so queries with different wording
  before you accept a record or give up. Vary the form of the name: singular and plural,
  "peppers, <name>, dried" (the SR Legacy style), the generic parent food, a close variety,
  and with or without the state (raw, dried, cooked). Run them one at a time. Compare the
  Foundation and SR Legacy hits across all the queries, and keep your notes. If no query
  finds a specific record, say so and name the closest generic record. Do not link a close
  variety without asking.

### Choosing portions

A linked ingredient has `perGram` macros. A recipe line reaches grams by its unit:

- a mass unit (g, kg, oz) converts directly, and needs nothing more;
- a volume unit (cup, tbsp, ml) needs a **volume measure**, such as `1 cup = 216 g`;
- a count unit (each, clove, can) needs a **measure for that exact unit**, such as `1 each = 50 g`.

`recipes show` names the missing weight: `No weight recorded for 1 cup of honey`.
`nutrition status` lists the missing weights that would make the most rows calculable.

- `--portion` stores a USDA portion as a measure. Repeat it to store several. `"1 large"`
  becomes `each` + size `large`; `"cup, chopped"` becomes `cup` + prep method `chopped`.
- A portion whose unit, size or prep method has no match in the database is refused with
  exit 6 and the reason, such as `no matching unit or size "jumbo"`. Do not force it through.
- `--all-portions` stores every portion that maps, and warns about each one it skips.
- A volume row is a density: one `1 cup` row prices teaspoons and millilitres of the same
  ingredient too. Prefer an unqualified volume portion; `cup, chopped` is a packing density.
- Roughly a third of foods offer no item portion. When a recipe counts the ingredient, look
  for a better record before giving up. **Do not invent a gram weight.**
- The `ambiguous` flag means read the label carefully. `NLEA serving`, `1 lemon yields` and
  `slice` all count like items and are not one whole item.
- When several sizes exist — egg spans 38 g to 63 g, onion 70 g to 150 g — store the sizes the
  recipes use, or the one a recipe writer would mean, usually medium or large. **State which
  you picked.**
- A sized measure (`each · medium`) never prices a line with no size (`1 banana`). For a
  counted ingredient, also pass `--default-portion` with the medium portion, or the size a
  recipe writer would mean. It stores that weight as `each` with no size.
- `nutrition measure` stores a weight that the **operator** supplies, from a label or a scale,
  such as `--unit scoop --grams 30`. Use it only with a weight the operator gave you.
- A measure with the same unit, size and prep method as an existing one exits 5. Report it.

## The USDA and Open Food Facts caches

`usdaFoodItem` and `openFoodFactsProduct` responses are cached on disk, so re-reading a record you already fetched is
free and does not touch the quota. Fetch a candidate as often as you find useful.

- Repeating `usda show <fdcId>` or `open-food-facts show <barcode>` costs nothing after the first call.
- A dry run and the write that follows reuse the record `usda show` fetched.
- Pass `--refresh` only when you have reason to think the record changed.
- `usda search` and `open-food-facts search` are not cached by the CLI, so do not repeat a search you
  have already run. Keep the results in your own working notes.

The USDA quota is 1000 requests per hour for the whole server, and each account may run 60
USDA searches per hour. Budget 5 to 10 searches and one record fetch per ingredient (see "Search
many times"), so an hour covers about 6 to 12 ingredients. Open Food Facts allows the server 12 product reads and
8 searches per minute; a `RATE_LIMITED` error says how long to wait.

## Reading the output

Every command accepts `--json` and then prints one object and nothing else. Parse that;
never parse the tables.

```json
{ "ok": true, "data": {}, "warnings": [] }
{ "ok": false, "error": { "code": "WOULD_OVERWRITE", "message": "...", "existing": {} } }
```

`warnings` is where the CLI tells you something is incomplete but not wrong — storable
portions that were not chosen, a portion flagged ambiguous, a record missing a macro, an Open
Food Facts data warning. Report them; do not discard them.

## Exit codes worth branching on

| Code | Meaning | What to do |
| --- | --- | --- |
| 3 | not authenticated, or the wrong role | stop; the account needs to be an admin |
| 4 | not found, or an ambiguous identifier | the error lists the candidates; pick an id |
| 5 | existing data would be replaced | **stop and report**; do not add `--overwrite` |
| 6 | the write was rejected | an unmatched portion, or server validation; re-plan |

Exit 5 and exit 6 are deliberately separate. Exit 6 may be worth retrying with different
arguments. Exit 5 is a decision for a person.
