import type { NutritionSourcePreference } from '@recipe/stores';
import { NutritionPortionFieldsFragment } from '@recipe/graphql/generated';
import { EnumNutritionalInfoCreateSource } from '@recipe/graphql/generated';
import { GetNutritionalInfosByIngredientIdsQuery } from '@recipe/graphql/generated';

export type ExistingNutritionalInfo = NonNullable<
    NonNullable<GetNutritionalInfosByIngredientIdsQuery['nutritionalInfosByIngredientIds']>[number]
>;

/** A named portion with a gram weight, from USDA or Open Food Facts. */
export type NutritionPortion = NutritionPortionFieldsFragment;

/** The source switch. Each choice writes the `source` of the same name. */
export type NutritionSource = NutritionSourcePreference;

export const SOURCE_ENUM: Record<NutritionSource, EnumNutritionalInfoCreateSource> = {
    usda: EnumNutritionalInfoCreateSource.Usda,
    openFoodFacts: EnumNutritionalInfoCreateSource.OpenFoodFacts,
    manual: EnumNutritionalInfoCreateSource.Manual,
};

export const SOURCE_LABELS: Record<NutritionSource, string> = {
    usda: 'USDA',
    openFoodFacts: 'Open Food Facts',
    manual: 'manual entry',
};

/** Values chosen from a source, ready to link. */
export interface NutritionSelection {
    source: NutritionSource;
    usdaFdcId: number | null;
    openFoodFactsBarcode: string | null;
    /** The item or product name, or where hand-entered values came from. */
    sourceName: string | null;
    perGram: MacroNutrients;
    /** Portions offered to the measures list. Empty for a USDA item, whose portions come
     *  from a second request. */
    portions: NutritionPortion[];
}

/** A portion for the measures list, with the prep method of the record it came from. */
export interface LinkedPortion {
    portion: NutritionPortion;
    prepMethodId: string | null;
    source: NutritionSource;
}

/** Props that every source panel takes. */
export interface SourcePanelProps {
    /** Makes input ids unique when the form shows more than one record. */
    idPrefix: string;
    ingredientId?: string;
    ingredientName?: string;
    disabled?: boolean;
    /** False while another source is chosen: the panel then drops its selection. */
    active: boolean;
    /** Called with the selected values before they are linked, or null. */
    onPreview: (selection: NutritionSelection | null) => void;
    onLink: (selection: NutritionSelection) => void;
}
