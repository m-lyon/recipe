# Spec: AUSNUT 2023 Density Fallback (conditional)

**Status:** deferred — do not implement until the decision gate below is measured
**Depends on:** `spec-fndds-portions.md` must be merged and measured first
**Blocks:** nothing

## Why this is conditional

`spec-fndds-portions.md` is expected to take Survey (FNDDS) records from 0% to ~81% density
coverage, and to close 8 of the 11 open gaps in this database. This spec exists for the
residue that fix cannot reach: records that carry no volume portion at all.

Building it is only worth the effort if that residue turns out to matter in practice. It
almost certainly should not be built speculatively. Measure first.

### Decision gate

After the parser fix is merged, run over every linked ingredient:

```
recipe ingredients list --limit 500 --json
```

then, for each `usdaFdcId`, check whether `chooseDensity` succeeds without
`--allow-ambiguous-density`. Proceed with this spec **only if all three hold**:

1. More than ~10% of linked ingredients still cannot derive a density, **and**
2. Those ingredients are genuinely used with volume units in real recipes — an ingredient
   only ever measured in grams does not need a density at all, **and**
3. Relinking them to a generic Survey or SR Legacy record does not fix it.

Point 3 matters most. In the measurement taken before the parser fix, both remaining gaps
(dijon mustard, seitan) were **Branded** records, which return no `foodPortions` in any
circumstance. Relinking `dijon mustard` from `Maille Traditional Dijon Mustard 215g`
(2182850) to a generic Survey mustard record is a two-minute `recipe nutrition link` call and
costs nothing. That is the correct first remedy, and it may well empty the residue on its
own.

If the residue survives all three checks, this spec is the answer.

## What AUSNUT 2023 offers

AUSNUT is the Australian food composition database published by Food Standards Australia
New Zealand. Unlike USDA, it publishes **density as a first-class field** rather than
leaving it to be inferred from a portion weight.

This matters because the FNDDS documentation explicitly warns against the inference we make:
*"Portion weights in FNDDS may not be applicable for calculating density or weight per volume
for any specific liquid."* AUSNUT states the density outright.

### Verified structure

Measured locally against `AUSNUT 2023 - Food measures.xlsx` (1.4 MB, downloaded from
<https://www.foodstandards.gov.au/science-data/food-nutrient-databases/ausnut/data-files>).

Sheet `AUSNUT 2023`, header on row 3, columns:

```
Survey ID | Public food key | Food name | Measure ID | Quantity |
Descriptor 1..4 | Gram amount | Volume
```

When `Descriptor 1 == "density"`, `Volume` is `1` and **`Gram amount` is the density in
g/mL**:

```
29101001  F000996  Beer, high alcohol (5% v/v & above)  40297  1  density  1.009  1
```

Verified counts:

| Metric | Value |
| --- | --- |
| Measure rows | 9,816 |
| Distinct foods | 3,713 |
| Foods carrying a density row | **3,500 (94.3%)** |

Descriptor frequency: `density` 3609, `bottle` 400, `packet` 371, `slice` 323, `can` 311,
`cup` 300, `fillet` 203, `bar` 175.

Densities cover solids as packed/bulk density, which is what a recipe cup actually needs —
e.g. `Sugar, white, granulated or lump 0.84`, `Rice, white, uncooked 0.87`,
`Breakfast cereal, corn, crispy pillows 0.12`.

### It agrees with the USDA-derived values

Cross-checked against the densities the fixed parser derives from USDA:

| Ingredient | AUSNUT | USDA-derived | Difference |
| --- | --- | --- | --- |
| Tomato, common, raw | 0.760 | 0.761 | 0.1% |
| Yeast, dry powder | 0.800 | 0.812 | 1.5% |
| Capers, pickled, canned, drained | 0.570 | 0.582 | 2.1% |
| Oil, olive | 0.920 | 0.947 | 2.9% |
| Mayonnaise, regular fat, commercial | 0.990 | 0.951 | 4.1% |
| Lettuce, iceberg, raw | 0.230 | 0.241 | 4.6% |

Every pair agrees within 5%. Note olive oil: 0.92 is the physically correct value, and
AUSNUT is the more accurate of the two.

This agreement is itself useful independently of any fallback — see *Secondary use* below.

### What it will and will not fix here

Checked against the two ingredients that were still failing before the parser fix:

- **dijon mustard** — covered. `Mustard, cream style` 1.050.
- **seitan** — **not covered.** AUSNUT has no seitan entry under any spelling checked.

So AUSNUT would have closed one of two gaps. Anything it does not carry still needs a
hand-entered `Ingredient.density`, which is already supported today. Set expectations
accordingly: this is a coverage improvement, not a guarantee.

## Design

### Recommended: a curated table, not a full import

Do **not** build a bulk importer with fuzzy name matching. This database holds 422
ingredients, and the residue after the parser fix is expected to be a handful. A fuzzy
matcher across 3,713 Australian food names would be more code, more risk of silently wrong
matches, and more maintenance than the problem justifies.

Instead:

1. Extract the density rows from the spreadsheet once, offline, with a throwaway script.
2. Hand-pick the entries that correspond to ingredients this database actually holds.
3. Commit the result as a small static JSON table in the repo.
4. Consult it only when USDA yields no density.

A wrong density is worse than a missing one, because a missing density surfaces as an
explicit error while a wrong one silently corrupts every recipe that uses the ingredient.
Hand-picking makes each match a reviewed decision.

### Data file

`api/src/data/ausnut-densities.json`, one entry per curated ingredient:

```json
[
  {
    "name": "dijon mustard",
    "density": 1.05,
    "source": "AUSNUT 2023 Food measures",
    "sourceFood": "Mustard, cream style",
    "publicFoodKey": "F005973"
  }
]
```

`sourceFood` and `publicFoodKey` are non-negotiable: they make each row auditable against the
upstream file, and they are what the CC BY attribution rests on.

### Lookup

A single function, consulted only after USDA has failed:

```ts
/** Looks up a curated AUSNUT density by ingredient name. Exact, case-insensitive match
 *  only -- a near-miss here would silently corrupt every recipe using the ingredient. */
export function ausnutDensity(ingredientName: string): AusnutDensity | null;
```

Exact match on a normalised name. No fuzzy matching, no stemming, no substring search.

### Wiring

`chooseDensity` in [`cli/src/lib/density.ts`](cli/src/lib/density.ts) currently throws when
no volume portion exists. That throw becomes the fallback point. The returned
`DensityChoice` needs a provenance field so the CLI can print where the number came from:

```
density 1.05 g/ml  (AUSNUT 2023: "Mustard, cream style" -- not from the linked USDA record)
```

Provenance must be visible. A density that did not come from the linked record is a weaker
claim than one that did, and the person reviewing the link has to be able to see that.

Persist the provenance on `NutritionalInfo` alongside the density, so the origin survives
past the moment of linking.

### Licensing

AUSNUT is published under **Creative Commons Attribution 3.0 Australia**. Confirm this
against the FSANZ disclaimer page before shipping — this was reported by research, not
verified directly.

If confirmed, attribution is required. Add it to `README.md` and keep the `source` field on
every row. CC BY imposes no share-alike obligation, so it does not affect the licence of
this project.

## Secondary use: validation, not just fallback

Given the ≤5% agreement measured above, the curated table is arguably more valuable as a
**check** on USDA-derived densities than as a fallback for missing ones.

`chooseDensity` already computes a `spread` across a record's volume portions. An AUSNUT
value gives a second, independent opinion for foods where USDA offers only one volume
portion and `spread` is therefore always 0 — precisely the cases where the derived density
is least well corroborated.

A warning on disagreement beyond ~15% would have caught, for example, a record whose only
volume portion is a `"cup, chopped"` packing density being used for a liquid.

This is cheaper than the fallback path and independent of the decision gate. If the gate says
"do not build the fallback", consider building this anyway.

## Alternatives rejected

| Source | Why not |
| --- | --- |
| Open Food Facts | Serving size is g **or** mL, never both, so no density is derivable. Coverage is barcoded branded products; generic ingredients are effectively absent. |
| CIQUAL (France) | Per-100 g only. No portion or density file. |
| CoFID (UK) | Portion data lives in *Food Portion Sizes*, a copyrighted printed handbook with no open dataset. |
| FPED (USDA) | Its "cup equivalents" are MyPlate food-group equivalents per 100 g, not the volume the ingredient occupies. Wrong quantity entirely. |
| FAO/INFOODS Density DB | Only 633 of 6,565 rows carry a density, and some are text ranges ("0.91-0.92"). Too thin to be primary; usable as a supplement to the curated table. |
| Nutritionix / Edamam / Spoonacular | All solve volume→grams well, but each is a paid external dependency with terms restricting caching. Disproportionate for a self-hosted app whose remaining gap is a handful of ingredients. |

## Definition of done

Only meaningful if the decision gate is passed.

- The decision gate is measured and its result recorded, including which ingredients remain
  uncovered and why relinking did not fix them.
- `api/src/data/ausnut-densities.json` exists, every row carries `sourceFood` and
  `publicFoodKey`, and every row was reviewed by hand.
- `ausnutDensity` matches exactly and case-insensitively, with tests covering a hit, a miss,
  and a near-miss that must **not** match.
- `chooseDensity` falls back only after USDA yields nothing, and reports provenance.
- The CLI prints the AUSNUT source on any density that did not come from the linked record.
- CC BY 3.0 AU attribution is confirmed and added to `README.md`.
- Every ingredient in the recorded residue either resolves or is documented as needing a
  hand-entered density.
