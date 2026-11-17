import { usePreferencesStore } from '@recipe/stores';
import { NutritionalInfoPanel } from '@recipe/features/viewing';

import { useDraftNutrition } from '../hooks/useDraftNutrition';

interface Props {
    recipeId?: string;
}
/** Closed until the user opens it, and it fetches nothing while closed. */
export function DraftNutritionPanel(props: Props) {
    const open = usePreferencesStore((state) => state.showDraftNutrition);
    const setOpen = usePreferencesStore((state) => state.setShowDraftNutrition);
    const { hasIngredients, ...nutrition } = useDraftNutrition(props.recipeId, open);
    if (!hasIngredients) return null;
    return <NutritionalInfoPanel {...nutrition} open={open} onToggle={setOpen} />;
}
