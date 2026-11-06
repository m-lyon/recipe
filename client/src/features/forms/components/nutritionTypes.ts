import type { NutritionSourcePreference } from '@recipe/stores';
import { NutritionPortionFieldsFragment } from '@recipe/graphql/generated';
import { EnumNutritionalInfoCreateSource } from '@recipe/graphql/generated';
import { GetNutritionalInfosByIngredientIdsQuery } from '@recipe/graphql/generated';

export type ExistingNutritionalInfo = NonNullable<
    NonNullable<GetNutritionalInfosByIngredientIdsQuery['nutritionalInfosByIngredientIds']>[number]
>;

export type NutritionPortion = NutritionPortionFieldsFragment;
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
    sourceName: string | null;
    perGram: MacroNutrients;
    portions: NutritionPortion[];
    warnings?: string[];
}

export interface LinkedPortion {
    portion: NutritionPortion;
    prepMethodId: string | null;
    source: NutritionSource;
}

export interface SourcePanelProps {
    idPrefix: string;
    ingredientId?: string;
    ingredientName?: string;
    disabled?: boolean;
    active: boolean;
    selection: NutritionSelection | null;
    onSelect: (selection: NutritionSelection | null) => void;
}
