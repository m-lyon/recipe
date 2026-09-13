# Spec: FNDDS Portion Parsing (recover volume portions from Survey records)

**Status:** ready to implement
**Depends on:** `spec-usda-portions.md` (the portion pipeline this corrects)
**Blocks:** nothing. This is a self-contained correction to the existing parser.
**Related:** `spec-ausnut-density.md` — a fallback density source, to be considered only if
this change leaves unacceptable gaps.

## Overview

`mapPortions` in [`api/src/schema/Usda.ts`](api/src/schema/Usda.ts) classifies every portion
of every Survey (FNDDS) record as `ITEM`, never `VOLUME`. No Survey record can therefore
supply a density, and `chooseDensity` rejects all of them with "This record has no volume
portion".

The cause is a one-line gap in `unitToken`. The data is present in the API response; the
parser cannot see it.

This spec fixes the parser. It adds no dependency, no new data source, and no new API call.

## Verified evidence

All measurements below were taken against the live FDC API on 2026-09-05 using the key in
`api/.env.development.local`, and against a locally cached corpus of 1,000 full records
(500 Survey, 500 SR Legacy) sampled through `/foods/list` + `POST /foods`.

### The two data types encode the amount differently

| Data type | `amount` | `modifier` | `portionDescription` |
| --- | --- | --- | --- |
| SR Legacy | `1` | `"cup, chopped"` | *(absent)* |
| Survey (FNDDS) | *(absent)* | `"10205"` (numeric code) | `"1 cup"` |

Raw response for `GET /v1/food/2710205?format=full` (Vegan mayonnaise, Survey):

```json
{ "measureUnit": { "name": "undetermined" }, "modifier": "10205", "gramWeight": 225,
  "portionDescription": "1 cup" }
{ "measureUnit": { "name": "undetermined" }, "modifier": "21000", "gramWeight": 14.1,
  "portionDescription": "1 tablespoon" }
```

`buildPortion` already handles the numeric modifier correctly: `isNumericCode` rejects
`"10205"`, so `label` falls back to `portionDescription`. The failure is one step later.

### `unitToken` does not strip a leading amount

[`api/src/schema/Usda.ts:117`](api/src/schema/Usda.ts#L117):

```ts
function unitToken(label: string): string {
    return label.toLowerCase().split(/[,(]/)[0].trim().replace(/\.$/, '');
}
```

It strips a *trailing* qualifier, so SR Legacy's `"cup, chopped"` resolves to `"cup"`.
It does not strip a *leading* amount, so Survey's `"1 cup"` resolves to `"1 cup"`, which is
absent from `VOLUME_ML`. `volumeMlPerUnit` returns `null`, `classifyPortion` falls through
rules 5 and 6, and rule 7 returns `ITEM`.

The mayonnaise density is discarded twice over: 225 g ÷ 236.588 mL = **0.951**, and
14.1 g ÷ 14.787 mL = **0.954**. The two agree to 0.3%.

### Measured coverage change

Current parser vs a parser that strips a leading amount, over the cached corpus:

```
Survey (FNDDS): 500 foods, 1870 labelled portions
   density derivable NOW   :    0 (  0.0%)
   density derivable FIXED :  407 ( 81.4%)     +450 portions

SR Legacy:      500 foods, 1192 labelled portions
   density derivable NOW   :  318 ( 63.6%)
   density derivable FIXED :  318 ( 63.6%)     unchanged
```

SR Legacy is unaffected, as required: its labels carry no leading amount, so the new branch
never fires on them.

### Measured effect on this database

422 ingredients, 13 linked to a USDA record, **0 with `density` set**.

| Outcome | Count | Ingredients |
| --- | --- | --- |
| Gains a density | **8** | olive oil 0.947, vegetable oil 0.947, soy sauce ×3 1.082, nutritional yeast 0.812, vegan mayo 0.951, cherry tomato 0.761 |
| Already had one | 3 | lemon juice, iceberg lettuce, caper |
| Still none | 2 | dijon mustard, seitan — both **Branded**, which returns no `foodPortions` at all |

Both remaining gaps are Branded records. Branded is out of scope here; see *Out of scope*.

### The existing safeguards hold

Where a food carries two or more volume portions, the implied densities agree within 1% for
65% of foods and within 10% for 77%. Every large disagreement has an identifiable cause, and
each is already handled by existing code:

```
   335%  Barley           '1 cup, cooked' 0.719   vs  '1 cup, dry, yields' 3.128
    53%  Avocado, raw     '1 cup, mashed' 0.972   vs  '1 cup' 0.634
    35%  Apple juice      '1 fl oz (no ice)' 1.048 vs  '1 fl oz (with ice)' 0.778
   101%  Basil, raw       '1 cup' 0.101          vs  '1 tablespoon' 0.203
```

- Prep state and cooked/dry are real differences, not data errors. `isAmbiguous` flags them,
  because each label contains a comma.
- `"(with ice)"` is meaningless as a density. `isAmbiguous` flags it, because the label
  contains parentheses.
- Basil is rounding: a tablespoon of basil weighs ~1.5 g and is reported as 3 g. This
  confirms the "prefer the largest volume" rule at
  [`cli/src/lib/density.ts:41`](cli/src/lib/density.ts#L41) is correct and load-bearing.

Of the 450 newly usable portions, **391 are clean** and 59 are flagged ambiguous under the
current `isAmbiguous` rule. Survey's bare `"1 cup"` has no comma or parenthesis, so the
common case arrives unblocked.

### A second defect the same fix corrects

`unitToken` is also used by `isMassUnit`. Survey mass portions such as `"1 oz"` currently
resolve to the token `"1 oz"`, miss `MASS_UNITS`, and are classified `ITEM`. `"1 oz"`
appeared 187 times in the corpus sample. An `ITEM` portion is offered for `perUnit`, so an
ounce of cheese can currently be selected as "one item" of cheese.

Stripping the leading amount fixes this at the same point: `"1 oz"` → `"oz"` → `WEIGHT`,
which `assertItemPortion` then refuses.

This changes which portions are *offerable* going forward. It does not touch stored data:
`perUnit` is persisted as a number on `NutritionalInfo`, not as a reference to a portion.

## Design decisions

### 1. Fix `unitToken`, not `classifyPortion`

The amount is a property of the label text, and every caller of `unitToken` wants the unit
word alone. Stripping the amount inside `unitToken` fixes volume and mass classification in
one place, and keeps `classifyPortion`'s seven ordered rules unchanged.

### 2. An explicit `amount` always wins over an embedded one

`buildPortion` must multiply the per-unit millilitres by the portion's amount. After this
change the amount can come from two places:

- `entry.amount` — SR Legacy, authoritative when present.
- the leading number in the label — Survey, the only source there.

The rule is `amount ?? embeddedAmount ?? 1`. An explicit `amount` always wins, so no SR
Legacy portion can be double-counted if a label ever carries both.

### 3. The effective amount feeds `isAmbiguous`

`isAmbiguous` flags `amount !== 1` because `"cup (4.86 large eggs)"` is not one item. Survey
labels such as a hypothetical `"2 tablespoons"` should be flagged on the same grounds, so
`buildPortion` passes the *effective* amount, not the raw `entry.amount`.

### 4. Descriptions do not change

`buildDescription` already prefers `portionDescription` for Survey records, and that string
("1 cup") is what `usda show` prints today. Nothing about the portion table's appearance
changes — only `kind`, `millilitres`, and `impliedDensity`.

## API changes

### `api/src/schema/Usda.ts`

Add an amount parser above `unitToken` (currently line 117):

```ts
/** A leading count in a portion label: "1", "1.5", "1/2", "1 1/2". */
const LEADING_AMOUNT = /^\s*(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.\d+|\d+)\s+/;

function parseAmountToken(raw: string): number | null {
    const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(raw);
    if (mixed) {
        const denominator = Number(mixed[3]);
        return denominator === 0 ? null : Number(mixed[1]) + Number(mixed[2]) / denominator;
    }
    const fraction = /^(\d+)\/(\d+)$/.exec(raw);
    if (fraction) {
        const denominator = Number(fraction[2]);
        return denominator === 0 ? null : Number(fraction[1]) / denominator;
    }
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

/**
 * Splits a leading amount off a portion label.
 *
 * SR Legacy keeps the count in `amount` and the unit in `modifier` ("cup, chopped").
 * FNDDS (Survey) has no `amount` and puts both in `portionDescription` ("1 cup"), so
 * without this split every Survey volume portion is misread as a countable item.
 */
function splitLeadingAmount(label: string): { amount: number | null; rest: string } {
    const match = LEADING_AMOUNT.exec(label);
    if (!match) return { amount: null, rest: label };
    return { amount: parseAmountToken(match[1]), rest: label.slice(match[0].length) };
}
```

Change `unitToken` to consume it:

```ts
/** Strips a leading amount and a trailing qualifier, so "1 cup", "cup, chopped" and
 *  "cup (4.86 large eggs)" all resolve their unit word. */
function unitToken(label: string): string {
    const { rest } = splitLeadingAmount(label);
    return rest.toLowerCase().split(/[,(]/)[0].trim().replace(/\.$/, '');
}
```

Change `buildPortion` (currently line 211) to resolve the effective amount:

```ts
    const usableModifier = modifier && !isNumericCode(modifier) ? modifier : null;
    const label = usableModifier ?? portionDescription;
    const kind = classifyPortion(label, measureUnitName, fromServingSize);
    // An explicit `amount` is authoritative; only fall back to a count embedded in the
    // label, which is the sole source on FNDDS records.
    const embedded = label ? splitLeadingAmount(label).amount : null;
    const effectiveAmount = amount ?? embedded ?? 1;
    const mlPerUnit = kind === 'VOLUME' ? volumeMlPerUnit(label) : null;
    // A zero or negative amount would divide by zero downstream.
    const millilitres =
        mlPerUnit == null || effectiveAmount <= 0 ? null : mlPerUnit * effectiveAmount;
    return {
        description: buildDescription(amount, usableModifier, portionDescription, measureUnitName),
        amount,
        modifier,
        gramWeight,
        kind,
        millilitres,
        impliedDensity: millilitres ? gramWeight / millilitres : null,
        ambiguous: isAmbiguous(label, effectiveAmount),
    };
```

Note `description` still receives the raw `amount`, so Survey descriptions continue to come
from `portionDescription` unchanged.

### Optional: one missing volume unit

`cubic inch` appeared 57 times in the corpus and is a genuine volume measure. Adding
`'cubic inch': 16.387` to `VOLUME_ML` is a one-line change already covered by the existing
"every known volume unit" test. Low value; include only if convenient.

## Tests — `api/test/graphql/NutritionalInfo.test.ts`

### New fixtures under `api/test/fixtures/usda/`

- `vegan-mayo-2710205.json` — Survey, carries both `"1 cup"` (225 g) and `"1 tablespoon"`
  (14.1 g), plus `"Quantity not specified"` and three guideline-amount rows.
- `soy-sauce-2707442.json` — Survey, a single `"1 tablespoon"` (16 g) volume portion beside
  `"1 individual packet"` and a guideline row.

Capture both with `GET /v1/food/<id>?format=full`, trimmed to the fields the existing
fixtures carry.

### Cases to add

1. **Survey volume portions are classified `VOLUME`.** From `vegan-mayo-2710205`, assert the
   `"1 cup"` portion has `kind: 'VOLUME'`, `millilitres` ≈ 236.588, and `impliedDensity`
   ≈ 0.951.
2. **The two portions of one Survey record agree.** Assert mayonnaise's cup and tablespoon
   densities are within 1% of each other. This is the regression guard for the amount
   multiplier: dropping it makes the tablespoon read 14× too dense.
3. **A Survey record with one volume portion still yields a density.** `soy-sauce-2707442`,
   `impliedDensity` ≈ 1.082.
4. **Survey non-volume portions are untouched.** `"1 individual packet"` stays `ITEM`;
   `"Quantity not specified"` stays `SERVING`.
5. **Survey mass portions become `WEIGHT`.** Synthetic record with
   `portionDescription: "1 oz"`, `gramWeight: 28.35` → `kind: 'WEIGHT'`, not `ITEM`.
6. **Fraction and mixed-number amounts parse.** Synthetic portions `"1/2 cup"` (118.294 mL)
   and `"1 1/2 cups"` (354.882 mL).
7. **A zero amount yields no density.** Synthetic `"0 cup"` → `millilitres: null`,
   `impliedDensity: null`, and no thrown error.
8. **Ambiguity still fires on Survey labels.** `"1 fl oz (with ice)"` → `ambiguous: true`.
   Bare `"1 cup"` → `ambiguous: false`.
9. **SR Legacy regression.** Every existing assertion over `olive-oil-171413`,
   `lemon-juice-167747`, `egg-171287`, `banana-173944`, `carrot-170393`, `garlic-1104647`
   and `flour-168894` must pass unchanged. This is the primary guard that the fix is
   additive.

The existing `should classify every known volume unit as VOLUME` test loops
`__testables.VOLUME_ML` and continues to cover any unit added to the table.

## Out of scope

- **Branded records.** They carry no `foodPortions`, only a gram serving size, so no parsing
  change can give them a density. The cheap remedy is record selection — relink to a generic
  Survey or SR Legacy record — not a parser change. `spec-ausnut-density.md` covers the
  case where that is not acceptable.
- **Direct portion matching.** For `3 tbsp vegan mayo`, USDA already states
  `1 tablespoon = 14.1 g`. Going ingredient → density → volume → grams is a lossy round-trip
  when an exact portion match exists. Matching the recipe's unit against a portion first
  would be both simpler and more accurate, with density as the fallback for units USDA does
  not list. Worth doing, but it is a change to the calculation pipeline, not to the parser,
  and it should land on top of this fix rather than instead of it.
- **The FNDDS modifier code table.** The bulk `food_portion.csv` maps all 1,134 numeric codes
  to their descriptions, but `portionDescription` already carries that text on every record
  checked, so the lookup is unnecessary.

## Definition of done

- `unitToken` strips a leading integer, decimal, fraction, or mixed number.
- `buildPortion` resolves the effective amount as `amount ?? embedded ?? 1` and guards
  against a non-positive amount.
- All nine test cases above pass, including the SR Legacy regression set.
- Re-running the coverage measurement over a fresh 500-record Survey sample shows ≥ 75% of
  records yielding at least one `VOLUME` portion, against 0% today.
- `recipe usda show 2710205` prints `1 cup` and `1 tablespoon` as kind `volume` with
  densities of 0.951 and 0.954.
- `recipe nutrition link` can derive a density for the 8 ingredients listed above without
  `--allow-ambiguous-density`.
