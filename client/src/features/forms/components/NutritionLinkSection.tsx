import { useQuery } from '@apollo/client';
import { Stack, Text } from '@chakra-ui/react';
import { useMemo, useRef, useState } from 'react';
import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';

import { SearchableSelect } from '@recipe/common/components';
import { GET_INGREDIENT_COMPONENTS } from '@recipe/graphql/queries/recipe';

import { MeasureForDensity } from '../utils/nutrition';
import { ShownNutrition } from './NutritionRecordEditor';
import { ExistingNutritionalInfo, LinkedPortion } from './nutritionTypes';
import { NutritionRecordEditor, NutritionRecordEditorHandle } from './NutritionRecordEditor';

/** Per-gram macros by the prep method of their record, null for the plain record. */
export type PerGramByPrep = ReadonlyMap<string | null, MacroNutrients>;

export interface NutritionLinkSectionProps {
    ingredientId?: string;
    ingredientName?: string;
    disabled?: boolean;
    /** Every record of this ingredient, prefetched by the page alongside the ingredient list. */
    existingNutritionalInfos?: ExistingNutritionalInfo[];
    /** The ingredient's measures, saved and staged, to convert per 100 ml to grams. */
    measures?: MeasureForDensity[];
    /** Called with the portions of the linked or selected items, which the measures list
     *  offers as one-click rows. */
    onPortionsChange?: (portions: LinkedPortion[]) => void;
    /** Called with the per-gram macros shown, so measures can show their calories. */
    onPerGramChange?: (perGram: PerGramByPrep) => void;
    /** Called after a record is saved or removed, so the prefetched list can be refreshed. */
    onNutritionalInfoChange?: () => void;
}

/** Linking and unlinking are staged; the parent saves them with the ingredient, once it has
 *  an id. Throws when a change could not be saved. */
export interface NutritionLinkSectionHandle {
    commitChanges: (ingredientId: string) => Promise<void>;
}

interface Slot {
    key: string;
    prepMethod: { _id: string; value: string } | null;
    existing: ExistingNutritionalInfo | null;
    /** Added in this form and not saved yet. */
    added: boolean;
}

const NO_INFOS: ExistingNutritionalInfo[] = [];
const NO_MEASURES: MeasureForDensity[] = [];

/**
 * The nutritional data of an ingredient: one record with no prep method, and one for each
 * prep method that changes the food (lime, juiced is lime juice). A recipe line uses the
 * record for its prep method, or else the plain one.
 */
export const NutritionLinkSection = forwardRef<
    NutritionLinkSectionHandle,
    NutritionLinkSectionProps
>(function NutritionLinkSection(props, ref) {
    const { ingredientId, ingredientName, disabled, onNutritionalInfoChange } = props;
    const { onPortionsChange, onPerGramChange } = props;
    const infos = props.existingNutritionalInfos ?? NO_INFOS;
    const measures = props.measures ?? NO_MEASURES;

    const { data: components } = useQuery(GET_INGREDIENT_COMPONENTS);
    const [added, setAdded] = useState<{ _id: string; value: string }[]>([]);
    const [shownBySlot, setShownBySlot] = useState<Record<string, ShownNutrition | null>>({});
    const editors = useRef(new Map<string, NutritionRecordEditorHandle>());
    // Undefined until the user opens or closes a record: the plain record then opens when
    // it has no values.
    const [openKey, setOpenKey] = useState<string | null>();

    useEffect(() => {
        setAdded([]);
        setOpenKey(undefined);
    }, [ingredientId]);

    const prepInfos = infos
        .filter((info) => info.prepMethod)
        .sort((a, b) => a.prepMethod!.value.localeCompare(b.prepMethod!.value));
    const slots: Slot[] = [
        {
            key: 'plain',
            prepMethod: null,
            existing: infos.find((info) => !info.prepMethod) ?? null,
            added: false,
        },
        ...prepInfos.map((info) => ({
            key: info.prepMethod!._id,
            prepMethod: info.prepMethod!,
            existing: info,
            added: false,
        })),
        // Once saved, an added record arrives with the infos and leaves this list.
        ...added
            .filter((prep) => !prepInfos.some((info) => info.prepMethod!._id === prep._id))
            .map((prep) => ({ key: prep._id, prepMethod: prep, existing: null, added: true })),
    ];
    const slotKeys = slots.map((slot) => slot.key).join(',');
    const shownKey = openKey === undefined ? (slots[0].existing ? null : 'plain') : openKey;

    const linkedPortions = useMemo(
        () =>
            slots.flatMap((slot) =>
                (shownBySlot[slot.key]?.portions ?? []).map((portion) => ({
                    portion,
                    prepMethodId: slot.prepMethod?._id ?? null,
                    source: shownBySlot[slot.key]!.source,
                }))
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [shownBySlot, slotKeys]
    );
    useEffect(() => {
        onPortionsChange?.(linkedPortions);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [linkedPortions]);

    const perGram = useMemo(() => {
        const map = new Map<string | null, MacroNutrients>();
        for (const slot of slots) {
            const shown = shownBySlot[slot.key];
            if (shown) map.set(slot.prepMethod?._id ?? null, shown.perGram);
        }
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shownBySlot, slotKeys]);
    useEffect(() => {
        onPerGramChange?.(perGram);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [perGram]);

    const commitChanges = useCallback(
        async (targetIngredientId: string) => {
            // Read every handle first: the form may unmount while a record is saved.
            const handles = slotKeys
                .split(',')
                .map((key) => editors.current.get(key))
                .filter((handle) => handle != null);
            let changed = false;
            try {
                for (const handle of handles) {
                    changed = (await handle.commitChanges(targetIngredientId)) || changed;
                }
            } finally {
                // Refetch even when a later record fails, so a retry updates the saved ones.
                if (changed) onNutritionalInfoChange?.();
            }
        },
        [slotKeys, onNutritionalInfoChange]
    );
    useImperativeHandle(ref, () => ({ commitChanges }), [commitChanges]);

    const usedPrepIds = new Set(slots.map((slot) => slot.prepMethod?._id));
    const prepOptions = (components?.prepMethods ?? [])
        .filter((prep) => !usedPrepIds.has(prep._id))
        .map((prep) => ({ value: prep._id, label: prep.value }));

    return (
        <Stack spacing={4}>
            <Text opacity={disabled ? 0.4 : undefined}>Nutritional data</Text>
            {slots.map((slot) => (
                <NutritionRecordEditor
                    key={slot.key}
                    ref={(handle) => {
                        if (handle) editors.current.set(slot.key, handle);
                        else editors.current.delete(slot.key);
                    }}
                    slotKey={`nutrition-${slot.key}`}
                    ingredientId={ingredientId}
                    ingredientName={ingredientName}
                    disabled={disabled}
                    prepMethod={slot.prepMethod}
                    existing={slot.existing}
                    measures={measures}
                    onShownChange={(shown) => setShownBySlot((s) => ({ ...s, [slot.key]: shown }))}
                    onRemove={
                        slot.added
                            ? () => {
                                  setAdded((a) => a.filter((p) => p._id !== slot.key));
                                  if (shownKey === slot.key) setOpenKey(null);
                              }
                            : undefined
                    }
                    open={shownKey === slot.key}
                    onOpen={() => setOpenKey(slot.key)}
                    onClose={() => setOpenKey(null)}
                />
            ))}
            <SearchableSelect
                label='Add values for a prep method'
                aria-label='Add values for a prep method'
                options={prepOptions}
                value={null}
                onChange={(id) => {
                    const prep = components?.prepMethods.find((p) => p._id === id);
                    if (!prep) return;
                    setAdded((a) => [...a, { _id: prep._id, value: prep.value }]);
                    setOpenKey(prep._id);
                }}
                disabled={disabled}
            />
        </Stack>
    );
});
