import type { NutritionSourcePreference } from '@recipe/stores';
import { NutritionPortionFieldsFragment } from '@recipe/graphql/generated';
import { EnumNutritionalInfoCreateSource } from '@recipe/graphql/generated';
import { GetNutritionalInfosByIngredientIdsQuery } from '@recipe/graphql/generated';

export type ExistingNutritionalInfo = NonNullable<
    NonNullable<GetNutritionalInfosByIngredientIdsQuery['nutritionalInfosByIngredientIds']>[number]
>;

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
    /** Problems with an Open Food Facts product's values, such as a missing macro. */
    warnings?: string[];
}

export interface LinkedPortion {
    portion: NutritionPortion;
    prepMethodId: string | null;
    source: NutritionSource;
}

export interface SourcePanelProps {
    /** Makes input ids unique when the form shows more than one record. */
    idPrefix: string;
    ingredientId?: string;
    ingredientName?: string;
    disabled?: boolean;
    /** False while another source is chosen or the search is closed: the panel then
     *  drops its selection. */
    active: boolean;
    /** The staged link, which is saved with the ingredient. */
    selection: NutritionSelection | null;
    onSelect: (selection: NutritionSelection | null) => void;
}
