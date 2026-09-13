# Spec: USDA Portion Data (perUnit + density derivation)

**Status:** ready to implement
**Depends on:** the `73-calorie-counting` branch (NutritionalInfo model, USDA proxy resolvers)
**Blocks:** `spec-cli.md`

## Overview

Linking an ingredient to a USDA food item currently populates `perGram` only. Two of the
three nutrition calculation paths need more than that:

| Recipe ingredient | Data needed | Source today |
| --- | --- | --- |
| `200 g flour` (mass unit) | `perGram` | USDA, works today |
| `1 cup milk` (volume unit) | `perGram` + `Ingredient.density` | density is manual |
| `2 eggs` (no unit) | `perUnit` | manual entry in the web form |

See the pipeline in
[`client/src/utils/nutrition.ts:100-190`](client/src/utils/nutrition.ts#L100-L190).

The USDA FoodData Central API already returns the gram weight of named portions. The current
resolver discards it, because it requests `format=abridged`. This change requests the full
format, exposes the portion data through GraphQL, and uses it to fill `perUnit` automatically
and to suggest a `density`.

## Verified evidence

All of the following was confirmed against the live FDC API using `DEMO_KEY`. Implementers
should re-confirm the Foundation and Branded shapes, which were not reached before the demo
key hit its rate limit.

### `format=abridged` omits portions

`GET /v1/food/171287?format=abridged` returns only:

```text
fdcId, description, dataType, publicationDate, ndbNumber, foodNutrients
```

`foodPortions` is absent. `format=full` returns it.

### `format=full` returns portion gram weights

`GET /v1/food/171287?format=full` — *Egg, whole, raw, fresh* (SR Legacy):

```json
{ "id": 88374, "amount": 1.0, "modifier": "large",  "gramWeight": 50.0,
  "sequenceNumber": 1, "measureUnit": { "id": 9999, "name": "undetermined",
  "abbreviation": "undetermined" } }
```

Full portion set: small 38 g, medium 44 g, large 50 g, extra large 56 g, jumbo 63 g,
`cup (4.86 large eggs)` 243 g.

### Volume portions yield a correct density

| fdcId | Food | Portion | gramWeight | Derived density | Reference |
| --- | --- | --- | --- | --- | --- |
| 168894 | Wheat flour, white, all-purpose | 1 cup | 125 g | 0.528 g/ml | ~0.53 |
| 171413 | Oil, olive, salad or cooking | 1 cup | 216 g | 0.913 g/ml | ~0.91 |
| 171413 | Oil, olive, salad or cooking | 1 tbsp | 13.5 g | 0.913 g/ml | consistent |

The two olive oil portions agree to three decimal places. That agreement is a usable
self-consistency check.

### Per-item portions are often absent, and rarely unique

**This is the main limit on automatic `perUnit`, and it is a bigger limit than it looks.**

Fifteen typical countable ingredients were queried against Foundation and SR Legacy, taking
the top search hit and reading its portions. Counting only portions that describe one whole
item, with no qualifier:

| Result | Count | Examples |
| --- | --- | --- |
| **No usable per-item portion** | 5 / 15 | garlic, potato, apple, celery |
| Exactly one | 2 / 15 | banana, red pepper |
| Several to choose from | 8 / 15 | egg, onion, carrot, tomato, mushroom |

So a third of these foods offer nothing to derive `perUnit` from, and over half offer a
choice that only a human or an agent can make. Concretely:

- **Egg** — five weights, 38 g to 63 g. A 66% spread. That "1 egg" means the 50 g large is a
  convention, not a fact the API states.
- **Onion** — `large` 150 g and `small` 70 g. More than a factor of two apart.
- **Zucchini** — `large` 323 g, `medium` 196 g.

### Four traps in the portion data

Each of these was hit while sampling. All produce a plausible-looking number that is wrong.

1. **Foundation records carry a RACC, not an item.** Garlic (1104647), apple (1750340) and
   celery (2346405) each return exactly one portion with `modifier: null`,
   `portionDescription: null`, `gramWeight` set, and `measureUnit.name: "RACC"`. RACC is the
   regulatory Reference Amount Customarily Consumed. Garlic's is **85 g** — roughly 28
   cloves. Read as "1 garlic" it is wrong by more than an order of magnitude.
   `measureUnit.name === 'RACC'` is a reliable signal, and Foundation records lean on it.
2. **`NLEA serving` looks like an item.** Banana's only unqualified portion is
   `1 NLEA serving = 126 g`. It parses as a count but is a labelling serving size.
3. **`yields` portions measure output, not the thing.** `Lemon juice, raw` offers
   `1 lemon yields = 48 g` — the juice from a lemon, not a lemon.
4. **`slice` sits beside whole-item sizes.** Carrot, bread, mushroom and zucchini all mix
   `slice` into the same array as `small` / `medium` / `large`.

### The chosen record matters more than the chosen portion

Two of the fifteen top search hits were the wrong food entirely:

- `chicken breast meat only raw` → **Pheasant, breast, meat only, raw**
- `lemons raw` → **Lemon juice, raw**

An earlier pass matched `squash zucchini raw` to *Squash, zucchini, **baby**, raw*, whose
`large` portion is **16 g** against the correct record's **323 g** — a twentyfold error from
picking the neighbouring record, with nothing in the portion data to signal it.

No amount of portion classification fixes this. It is why the USDA item must be chosen by a
human or an agent that reads the description, and why the CLI shows the matched description
on every line.

### Search results carry no portions

`GET /v1/foods/search` returns a `foodMeasures` array on each hit, but it was **empty** for
every SR Legacy result tested. Portions are therefore only available from the single-item
endpoint. This forces a two-step flow in the UI and CLI: search, then fetch the selected item.

### Constraints found

1. **The portion label is free text.** `measureUnit.name` is `"undetermined"` on SR Legacy
   records. The usable information is in `modifier` (`"large"`, `"cup"`, `"tablespoon"`,
   `"tsp"`). Any volume conversion must parse that string.
2. **Some modifiers are ambiguous.** `"cup (4.86 large eggs)"` and `"cup, chopped"` describe
   packing density, not true density. These must be flagged, not used silently.
3. **Branded foods use a different shape** — `servingSize`, `servingSizeUnit`,
   `householdServingFullText` instead of `foodPortions`.
4. **Rate limits are low.** `DEMO_KEY` blocked after roughly ten calls. A production key
   allows 1000 requests per hour.

## Design decisions

### 1. Derivation happens in the API resolver, not the client

The web client and the planned CLI (`spec-cli.md`) are separate npm projects with no shared
code. Deriving millilitres and density in `client/src/utils/` would force the CLI to
duplicate it. The API resolver therefore does the derivation and exposes the results as
plain fields. Both consumers read them.

This also settles where the `cup → millilitres` lookup lives: server-side, in one place, as a
constant table. It deliberately does **not** read `Unit` or `UnitConversion` — see "Volume
unit resolution" below for why that would return nothing today and the wrong scale later.
The resolver stays pure: HTTP in, arithmetic, no database access.

### 2. Both `perUnit` and `density` need a chosen portion; neither is automatic

Once a portion is chosen, `perUnit = perGram × gramWeight` is exact arithmetic. **Choosing
the portion is the hard part, and it is a judgement call.** Three ways it goes wrong:

1. **No per-item portion exists.** Flour and olive oil have only volume portions. A countable
   ingredient linked to such a record has nothing to derive from.
2. **Several per-item portions exist and disagree.** The egg offers 38 g through 63 g. Which
   one is "1 egg" in a recipe is a choice.
3. **The portion is not a per-item portion at all.** `cup (4.86 large eggs)` sits in the same
   array as the five egg sizes. Using it as `perUnit` overstates one egg roughly fivefold.

So `perUnit` is **filled in from an explicit portion choice**, never inferred from the food
item alone. The difference from `density` is not certainty. It is:

| | `perUnit` | `density` |
| --- | --- | --- |
| Written to | `NutritionalInfo`, the record being created anyway | `Ingredient`, a different document |
| Once a portion is picked | exact | can still be a packing density (constraint 2) |
| Saved by | the same action as the link | the ingredient form's Save, or an explicit CLI flag |

`perUnit` rides along with the link because it belongs to the record being written and the
reader has just chosen its source. `density` needs a separate acceptance because it changes a
document the reader did not set out to edit, and because the value can be wrong even after a
portion is chosen.

Both consumers must therefore:

- Offer only `item`-kind portions as a source for `perUnit` (see the `kind` field below).
- Keep manual `perUnit` entry available, because case 1 is common.
- Say plainly when no per-item portion exists, rather than silently linking `perGram` only
  and leaving a countable ingredient uncalculable.

### 3. Density propagates through the ingredient form, not through a separate mutation

`density` is already a field on the ingredient form
([`BaseIngredientForm.tsx:109-118`](client/src/features/forms/components/BaseIngredientForm.tsx#L109-L118)),
and both wrappers submit the whole record:

- `CreateIngredientForm` → `ingredientCreateOne` with the full `ModifyableIngredient`.
- `ModifyIngredientForm` → `ingredientUpdateById` with the full `ModifyableIngredient`.

So an accepted density suggestion is applied to the **form field** via the existing
`handleChange('density', …)`, and the user's normal Save persists it. One mechanism covers
both flows, and no new mutation call is added to `UsdaLinkSection`.

This matters most for the **create** flow. A brand new ingredient has no `_id` yet, so
`UsdaLinkSection` stages the nutrition link and `CreateIngredientForm` commits it afterwards
through `commitPendingLink`. A density written by a separate `ingredientUpdateById` call
would have nothing to update at that point. Writing to the form field instead means the
density is part of the create record, saved in one round trip, before any ingredient exists.

`isCountable` already flows down from the form into `UsdaLinkSection`. This adds the return
path: a callback prop flowing a suggestion up.

The CLI has no form, so it persists an accepted density with an explicit
`ingredientUpdateById` call. The two consumers differ only in how they persist. They share
the derivation, which is why decision 1 puts that in the resolver.

### 4. One `UsdaFoodItem` type, portions empty from search

`usdaSearch` and `usdaFoodItem` keep returning the same type. `portions` is a non-null list
that is empty for search results. A second type would duplicate seven fields to express one
difference. The empty list is documented in the field description.

## API changes

### `api/src/schema/Usda.ts`

**Add a portion type:**

```typescript
const UsdaFoodPortionTC = schemaComposer.createObjectTC({
    name: 'UsdaFoodPortion',
    fields: {
        // Human-readable label, e.g. "1 large" or "1 cup"
        description: 'String!',
        amount: 'Float',
        modifier: 'String',
        gramWeight: 'Float!',
        // What the portion measures. Only ITEM portions may be used to
        // derive perUnit; only VOLUME portions can imply a density.
        kind: 'UsdaPortionKind!',
        // Non-null only when `modifier` maps to a known volume unit
        millilitres: 'Float',
        // gramWeight / millilitres, when millilitres is known
        impliedDensity: 'Float',
        // True when the modifier carries a qualifier that makes the portion
        // unreliable for its kind: a packing density rather than a true
        // density, or a count that is not one whole item.
        // e.g. "cup, chopped" or "cup (4.86 large eggs)".
        ambiguous: 'Boolean!',
    },
});
```

**Add the kind enum:**

```typescript
schemaComposer.createEnumTC({
    name: 'UsdaPortionKind',
    values: {
        // One countable thing: "1 large", "1 clove", "1 slice". Usable for perUnit.
        ITEM: { value: 'ITEM' },
        // Maps to a volume unit: "1 cup", "1 tbsp". Usable for density, never perUnit.
        VOLUME: { value: 'VOLUME' },
        // Maps to a mass unit: "1 oz". Redundant with perGram; offer for neither.
        WEIGHT: { value: 'WEIGHT' },
        // Branded servingSize fallback. A serving is not necessarily one item.
        SERVING: { value: 'SERVING' },
    },
});
```

Classification rules, applied in order. Let `label` be `modifier`, falling back to
`portionDescription`:

1. `measureUnit.name === 'RACC'` → `SERVING`. **Check this first.** It is the regulatory
   Reference Amount Customarily Consumed, it is what Foundation records carry, and it is
   never one item. Garlic's RACC is 85 g.
2. `label` is null or empty → `SERVING`. Nothing can be claimed about an unlabelled portion,
   and in practice these are RACC rows.
3. Built from the Branded `servingSize` fallback → `SERVING`.
4. `label` matches a known volume unit → `VOLUME`.
5. `label` matches a known mass unit → `WEIGHT`.
6. Otherwise → `ITEM`.

`ambiguous` is independent of `kind`. Set it when any of these hold:

- `label` contains a comma or a parenthesis — `slice, medium (1/8" thick)`.
- `amount` is not exactly 1 — `0.5 breast, bone removed`.
- `label` contains `yields` — `1 lemon yields` is juice output, not a lemon.
- `label` contains `serving` — `NLEA serving` counts like an item but is a serving size.
- `label` contains `slice` — a slice is a real item, but it sits beside whole-item sizes and
  is a common mis-pick. Flag it rather than hide it.

So `cup (4.86 large eggs)` is `VOLUME` **and** `ambiguous`, and never reaches the `perUnit`
path because it is not `ITEM`. Preventing that specific fivefold error is why `kind` exists.

These rules are heuristics over free text. They exist to **rank and warn**, not to decide.
Neither consumer may auto-select a portion, even when exactly one `ITEM` portion is clean —
banana's sole clean candidate is `NLEA serving`. The reader always picks.

**Add to `UsdaFoodItemTC`:**

```typescript
portions: {
    type: '[UsdaFoodPortion!]!',
    description:
        'Named portions with gram weights. Always empty for usdaSearch results, ' +
        'because the USDA search endpoint does not return portion data. Fetch ' +
        'usdaFoodItem(fdcId:) to get portions.',
},
servingSize: 'Float',
servingSizeUnit: 'String',
householdServingFullText: 'String',
```

**Change the fetch format.** `usdaFoodItem` currently requests `format=abridged`
([`api/src/schema/Usda.ts:88`](api/src/schema/Usda.ts#L88)). Change to `format=full`.

> Verify that the abridged nutrient extraction in `extractNutrient` still works against the
> full format. Full-format `foodNutrients` entries nest the id under
> `nutrient.id` rather than `nutrientId`. `extractNutrient` already handles both shapes, so
> this should pass unchanged — confirm it with a test rather than by inspection.

**Add portion mapping.** A new function `mapPortions(item)` that:

1. Reads `item.foodPortions` when present.
2. Falls back to `servingSize` / `servingSizeUnit` / `householdServingFullText` for Branded
   items, producing at most one portion.
3. Builds `description` from `amount` and `modifier` (e.g. `1` + `"large"` → `"1 large"`).
   Falls back to `portionDescription` when `modifier` is absent.
4. Resolves `millilitres` from the modifier (see next section).
5. Sets `impliedDensity = gramWeight / millilitres` when millilitres is known.
6. Sets `ambiguous = true` when the modifier contains a comma, parentheses, or any token
   beyond the recognised volume unit name.
7. Sorts by `sequenceNumber` when present.

`mapFoodItem` gains `portions: mapPortions(item)` and returns `[]` when `foodPortions` is
absent, so `usdaSearch` needs no change.

### Volume unit resolution

**Requirement:** convert a free-text portion modifier such as `"cup"`, `"tablespoon"`,
`"tbsp"`, `"tsp"`, `"fl oz"` into millilitres. Return `null` for anything not recognised as a
volume unit, including `"large"`, `"medium"`, `"slice"`.

**Mechanism: a constant table in the resolver. Do not read `UnitConversion`.**

```typescript
// US customary. USDA portion data is US customary by definition, so a cup here
// is always 236.588 ml, whatever a given database calls a cup.
const VOLUME_ML: Record<string, number> = {
    'ml': 1, 'millilitre': 1, 'milliliter': 1,
    'l': 1000, 'litre': 1000, 'liter': 1000,
    'tsp': 4.92892, 'teaspoon': 4.92892,
    'tbsp': 14.78676, 'tablespoon': 14.78676,
    'fl oz': 29.5735, 'fluid ounce': 29.5735,
    'cup': 236.588,
    'pint': 473.176, 'quart': 946.353, 'gallon': 3785.41,
};
```

Reading the database was the obvious choice and it is the wrong one. Three reasons, each
verified against this repository:

1. **It returns nothing today.** `populateUnits()` in `api/src/utils/populate.ts` creates no
   `UnitConversion` records at all — the volume group exists only in
   `api/test/utils/data.ts`. And `api/src/scripts/updateSchema_2026-03-29.js` is an explicit
   no-op stating that `Unit.measureType` "defaults to null for existing documents". So every
   production unit has `measureType: null`, and a `measureType: 'volume'` filter matches
   nothing. Every density suggestion would silently be absent.
2. **The base unit is not millilitres.** The fixture volume group uses `baseUnit: teaspoon`
   with `cup → 48` and `tbsp → 3`. Nothing in the schema requires a volume group to be based
   on millilitres, and the one that exists is not.
3. **`Ingredient.density` is g/ml.** The form labels it `Density (g/ml)`. A derivation that
   produced grams per teaspoon, or grams per whatever base unit an admin happened to choose,
   would write a wrong number into a field with a fixed meaning.

USDA units are a property of the USDA data, not of this database. A constant table is the
correct representation, and it stays correct if someone later defines a 250 ml "cup" unit for
display purposes.

**Classification depends on this table.** Rule 4 of the `kind` rules resolves `VOLUME` by
membership in `VOLUME_ML`. A volume word missing from the table falls through to `ITEM` and
would then be offered as a `perUnit` source. Keep the table complete for US customary
volumes, and add a test that every key classifies as `VOLUME`.

### When the modifier is not a recognised volume unit

This is the normal case, not an error. `1 large`, `1 slice` and `1 clove` are all not volume
units, and neither is an unrecognised word.

- `millilitres` → `null`
- `impliedDensity` → `null`
- `kind` → whatever the other rules give, usually `ITEM`

The consumer then shows no density suggestion. Nothing fails, nothing is logged as an error,
and the manual density field on the ingredient form remains the way to set one. A food with
only per-item portions — the egg — correctly yields no density, because per-item portions
carry no volume information.

> **Separate pre-existing issue, flagged not fixed here.** `convertToMl` in
> [`client/src/utils/nutrition.ts`](client/src/utils/nutrition.ts) returns
> `quantity × baseToUnitConversion`, which is a count of **base units**, not millilitres. With
> the fixture group that is teaspoons, so `ml × density` is out by a factor of about 4.93.
> This affects the branch's existing calculation regardless of this spec. It only stays hidden
> because no unit has a `measureType` yet, so the volume path never runs. Whoever populates
> `measureType` and the volume `UnitConversion` must either base that group on millilitres or
> fix `convertToMl`. Worth its own ticket.

### Tests — `api/test/graphql/NutritionalInfo.test.ts`

Extend the existing USDA describe blocks. They already stub `global.fetch` with sinon
([line 506](api/test/graphql/NutritionalInfo.test.ts#L506)); follow that pattern.

Required cases:

1. `usdaFoodItem` requests `format=full` — assert on the stubbed fetch URL.
2. Egg fixture (SR Legacy, six portions) returns six portions, sorted, with
   `"1 large"` at `gramWeight: 50`, `millilitres: null`, `ambiguous: false`.
3. The `"cup (4.86 large eggs)"` portion returns `ambiguous: true`.
4. Olive oil fixture returns `impliedDensity` of 0.913 for both the cup and tablespoon
   portions, within a tolerance of 0.001.
5. A Branded fixture with `servingSize` and no `foodPortions` returns exactly one portion,
   of `kind: SERVING`.
6. An item with no portion data at all returns `portions: []` and does not throw.
7. `usdaSearch` results still return `portions: []`.
8. Macro extraction is unchanged under `format=full` — assert `caloriesPer100g` etc. against
   the existing expected values.

Classification cases, each drawn from a real record named in the evidence section:

9. **RACC.** Garlic 1104647 — one portion, `modifier: null`, `measureUnit.name: "RACC"`,
   `gramWeight: 85`. Must classify as `SERVING`, not `ITEM`. This is the highest-value test
   in the set; getting it wrong writes a garlic clove as 85 g.
10. Egg 171287 — the five size portions are `ITEM`, and `cup (4.86 large eggs)` is `VOLUME`
    and `ambiguous`. Assert that filtering to `kind: ITEM` yields exactly five.
11. Banana 173944 — `NLEA serving` is flagged `ambiguous`.
12. `Lemon juice, raw` 167747 — `1 lemon yields` is flagged `ambiguous`.
13. A `slice` portion is flagged `ambiguous` and still classified `ITEM`.
14. Olive oil 171413 — every portion is `VOLUME`, so an `ITEM` filter returns an empty list.
    This is the "no per-item portion" path the client must handle.

Volume resolution cases:

15. Every key in `VOLUME_ML` classifies as `VOLUME`. A table gap silently promotes a volume
    word to `ITEM`, so this is a loop over the table, not a spot check.
16. An unrecognised modifier returns `millilitres: null` and `impliedDensity: null`, and the
    resolver does not throw. `1 large` is the case to assert.
17. The resolver performs **no database query**. Assert it works with no `Unit` or
    `UnitConversion` documents present, which is the state of the production database today.
    A test that passes only because the fixture seeds conversions would hide the bug this
    decision exists to avoid.
18. `1 cup` of olive oil returns `millilitres: 236.588`, not 240 and not 250.

Store fixtures as trimmed real responses under `api/test/fixtures/usda/`. Trim `foodNutrients`
to the four nutrients the resolver reads plus one it ignores.

## Client changes

### `client/src/graphql/queries/nutritionalInfo.ts`

Add the detail query. `usdaFoodItem` has no client query today; this is its first consumer.

```typescript
export const USDA_FOOD_ITEM = gql(`
    query UsdaFoodItem($fdcId: Int!) {
        usdaFoodItem(fdcId: $fdcId) {
            fdcId
            description
            brandOwner
            caloriesPer100g
            proteinPer100g
            carbsPer100g
            fatPer100g
            portions {
                description
                amount
                modifier
                gramWeight
                millilitres
                impliedDensity
                ambiguous
            }
        }
    }
`);
```

Update `client/src/graphql/queries/__mocks__/nutritionalInfo.ts` with a matching mock, and
add `portions` to every existing `usdaSearch` mock object (empty array). Per AGENTS.md, a new
field on a query requires updating all mock objects.

Re-run `npm run generate` in `client/` afterwards. It needs the API running.

### `client/src/features/forms/components/UsdaLinkSection.tsx`

Current behaviour: `handleSelectResult` reads macros straight out of the cached search result
and sets `pendingNutrition`. Per-unit macros are typed by hand into four `NumberInput` fields.

**New prop:**

```typescript
/** Called when a chosen portion implies a density for the ingredient. The parent
 *  form applies it to its own density field, so it saves with the ingredient
 *  record in both the create and the edit flow. */
onDensitySuggested?: (suggestion: {
    density: number;
    portionDescription: string;   // "1 cup"
    gramWeight: number;           // 216
    ambiguous: boolean;
}) => void;
```

Also accept `currentDensity?: number` so the component can compare against the form's value.

**New behaviour:**

1. On selecting a search result, fire a lazy `USDA_FOOD_ITEM` query for that `fdcId`. Keep
   deriving `perGram` from the search result so the existing display does not wait on the
   second request.
2. **When `isCountable` is true**, render a portion picker above the existing per-unit
   fields. It lists only `kind: ITEM` portions, each showing `description` and `gramWeight`,
   with `ambiguous` ones sorted last and marked. Nothing is preselected — the evidence above
   shows a sole clean candidate can still be wrong, so the reader always chooses.

   Selecting a portion sets all four per-unit fields to `perGram × gramWeight` and marks them
   as derived. The fields stay editable; editing one clears the derived marker but keeps the
   value.

   **When there are no `ITEM` portions**, which the sample says happens for roughly a third
   of foods, do not render an empty picker. Show a short line saying this USDA record has no
   per-item portion, and leave the existing manual per-unit fields as the way forward. Never
   silently link `perGram` alone and leave a countable ingredient uncalculable.

   Non-`ITEM` portions are never offered here. A `VOLUME` portion in this list is how the
   `cup (4.86 large eggs)` fivefold error would reach the database.
3. **When at least one portion has a non-null `impliedDensity`**, show a density suggestion.
   Prefer a non-ambiguous portion. Show the source portion so the reader can judge it, e.g.
   `Suggested density: 0.91 g/ml (from 1 cup = 216 g)`. `Apply` calls
   `onDensitySuggested`. Ambiguous-only suggestions render with a warning that the value is a
   packing density.

   Show this for countable ingredients too. A countable ingredient can still appear in a
   recipe measured by volume, and `Ingredient.density` is independent of `isCountable`.
4. Suppress the suggestion when `currentDensity` is already set and within 10% of the
   suggestion. When it differs by more than 10%, show both values and let the reader choose.
5. `UsdaLinkSection` never writes `density` itself. It has no mutation for it. It only
   reports the suggestion upward.

Keep the component's existing reset-on-ingredient-change effect working: portion selection
and the fetched detail must clear when `ingredientId` changes.

New UI must be **Mantine**, per the decision recorded in `spec-document.md` and AGENTS.md.
The surrounding component is Chakra; follow the migration guidance in AGENTS.md for matching
styles.

### `client/src/features/forms/components/BaseIngredientForm.tsx`

Wire the callback into the existing form state. This is the whole change:

```tsx
<UsdaLinkSection
    ref={usdaLinkRef}
    ingredientId={ingredientId}
    ingredientName={initData?.name}
    isCountable={formData.isCountable}
    currentDensity={formData.density}
    onDensitySuggested={({ density }) => handleChange('density', density)}
    disabled={disabled}
    existingNutritionalInfo={existingNutritionalInfo}
    onNutritionalInfoChange={onNutritionalInfoChange}
/>
```

`handleChange` already drives the `Density (g/ml)` input, so the applied value becomes
visible in the field immediately. The reader can still edit or clear it before saving.

No change is needed in `CreateIngredientForm.tsx` or `ModifyIngredientForm.tsx`. Both already
submit the complete `ModifyableIngredient` record.

### Resulting flows

**Creating a new ingredient** (`CreateIngredientForm`):

1. Reader types a name, searches USDA, selects a result.
2. Portion data arrives. Reader picks `1 cup = 216 g`, or accepts the suggested density.
3. `onDensitySuggested` fills the form's density field. Nothing is sent yet.
4. Reader presses Save. `ingredientCreateOne` creates the ingredient **with the density
   included**, in one round trip.
5. `onCompleted` calls `commitPendingLink(newId)`, which creates the `NutritionalInfo` with
   `perGram`, `usdaFdcId`, and any portion-derived `perUnit`.

The staged-link machinery already in `CreateIngredientForm` needs no change. Portion-derived
`perUnit` reaches the server through `buildRecord`, which already handles `perUnit`.

**Editing an existing ingredient** (`ModifyIngredientForm`):

1. Same steps 1-3.
2. Reader presses Save. `ingredientUpdateById` persists the density with the rest of the
   record.
3. Linking still fires immediately from `UsdaLinkSection` as it does today, because the
   ingredient already has an `_id`.

Note the asymmetry that already exists and is unchanged here: the nutrition link saves
immediately on Edit but is staged on Create. Density follows the form in both cases, so the
reader sees one consistent rule — density saves when the ingredient saves.

### Client tests

- Portion picker renders, selecting a portion fills the per-unit fields, manual edit
  overrides it, picker is hidden when no portions are returned.
- Density suggestion renders for a volume-capable item, is hidden when no portion has an
  implied density, warns on ambiguous-only, and is suppressed when the current density is
  within 10%.
- `Apply` calls `onDensitySuggested` and does **not** fire any mutation.
- `BaseIngredientForm`: applying a suggestion updates the visible density input, and the
  value appears in the record passed to `submitForm`.
- **Create flow integration test** — the critical case for this change. Create a new
  ingredient, search, select a result, apply the density, save. Assert that the
  `ingredientCreateOne` mutation carries the density, and that the follow-up
  `nutritionalInfoCreateOne` carries the derived `perUnit`.
- **Edit flow integration test** — apply a density to an existing ingredient and assert it
  appears in the `ingredientUpdateById` record.
- Switching ingredients clears portion state.

Integration cases belong in `client/src/__tests__/index.nutrition.test.tsx`.

## Out of scope

- Automatic density writes without confirmation.
- Bulk or batch linking. That is `spec-cli.md`.
- Caching USDA responses. Worth doing when the CLI starts making bulk calls; not needed for
  the interactive form.
- Any change to the `NutritionalInfo` model. `perUnit` already exists and already accepts
  these values.

## Definition of done

- [ ] `usdaFoodItem` fetches `format=full` and returns populated `portions`.
- [ ] `impliedDensity` matches the verified reference values for fdcId 168894 and 171413.
- [ ] Ambiguous modifiers are flagged.
- [ ] Branded items produce a portion from `servingSize`.
- [ ] API tests pass: `cd api && npm test`.
- [ ] Codegen regenerated; `cd client && npm run check-types` passes.
- [ ] Client tests pass: `cd client && npm test -- run`.
- [ ] `cd client && npm run lint` passes.
- [ ] Selecting a portion for a countable ingredient fills `perUnit` without manual typing.
- [ ] A density suggestion appears for olive oil and requires an explicit Apply.
- [ ] Applying a density updates the form's density field and fires no mutation of its own.
- [ ] Creating a **new** ingredient with an applied density saves it in the
      `ingredientCreateOne` record, and the staged nutrition link still commits afterwards.
- [ ] Editing an existing ingredient saves an applied density through `ingredientUpdateById`.
