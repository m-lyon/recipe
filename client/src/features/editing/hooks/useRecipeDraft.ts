import { useCallback, useEffect, useRef } from 'react';

import { useRecipeStore } from '@recipe/stores';
import type { RecipeState } from '@recipe/stores';
import { useInfoToast } from '@recipe/common/hooks';

const STORAGE_PREFIX = 'recipe:draft:';
export const DRAFT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const DRAFT_FIELDS = [
    'title',
    'notes',
    'source',
    'pluralTitle',
    'isIngredient',
    'numServings',
    'createVeganVersion',
    'editableTag',
    'finishedTags',
    'ingredientSections',
    'instructionSections',
] as const satisfies ReadonlyArray<keyof RecipeState>;
type DraftData = Pick<RecipeState, (typeof DRAFT_FIELDS)[number]>;

interface StoredDraft {
    data: DraftData;
    savedAt: number;
}

function storageKey(key: string) {
    return `${STORAGE_PREFIX}${key}`;
}

function toDraft(state: RecipeState): DraftData {
    const draft = {} as Record<string, unknown>;
    for (const field of DRAFT_FIELDS) {
        draft[field] = state[field];
    }
    return draft as DraftData;
}

function writeDraft(key: string, state: RecipeState) {
    const stored: StoredDraft = { data: toDraft(state), savedAt: Date.now() };
    try {
        localStorage.setItem(storageKey(key), JSON.stringify(stored));
    } catch {
        // Storage can be full or blocked; the in-memory store still works.
    }
}

function readDraft(key: string): DraftData | null {
    try {
        const raw = localStorage.getItem(storageKey(key));
        if (!raw) {
            return null;
        }
        const stored = JSON.parse(raw) as StoredDraft;
        if (!stored?.data || Date.now() - stored.savedAt > DRAFT_MAX_AGE) {
            localStorage.removeItem(storageKey(key));
            return null;
        }
        return stored.data;
    } catch {
        return null;
    }
}

function removeDraft(key: string) {
    try {
        localStorage.removeItem(storageKey(key));
    } catch {
        // Nothing to clean up if storage is unavailable.
    }
}

/**
 * Keeps a draft of the recipe store for one create or edit page.
 *
 * @param key identifies the page and recipe, e.g. `edit:<titleIdentifier>`
 * @param enabled set to true once the page has filled the store, so the initial reset and
 *   hydration are not saved as a draft
 */
export function useRecipeDraft(key: string, enabled: boolean) {
    const infoToast = useInfoToast();
    // The toast function changes on each render; a ref keeps loadDraft stable.
    const infoToastRef = useRef(infoToast);
    infoToastRef.current = infoToast;
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Applies a saved draft to the store. Returns true when a draft was applied, in which
    // case the caller must not fill the store from other data.
    const loadDraft = useCallback(() => {
        const draft = readDraft(key);
        if (!draft) {
            return false;
        }
        useRecipeStore.setState({
            ...draft,
            tagsDropdownIsOpen: false,
            ingredientSections: draft.ingredientSections.map((section) => ({
                ...section,
                editable: { ...section.editable, showDropdown: false, popover: null },
            })),
        });
        infoToastRef.current({ title: 'Restored unsaved changes', position: 'top' });
        return true;
    }, [key]);

    // Stops saving and removes the draft, e.g. after the recipe was submitted.
    const clearDraft = useCallback(() => {
        unsubscribeRef.current?.();
        unsubscribeRef.current = null;
        removeDraft(key);
    }, [key]);

    useEffect(() => {
        if (!enabled) {
            return;
        }
        unsubscribeRef.current = useRecipeStore.subscribe((state) => writeDraft(key, state));
        return () => {
            unsubscribeRef.current?.();
            unsubscribeRef.current = null;
            removeDraft(key);
        };
    }, [key, enabled]);

    return { loadDraft, clearDraft };
}
