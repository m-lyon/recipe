import { useMutation } from '@apollo/client';
import { KeyboardEvent, RefObject } from 'react';

import { useRecipeStore } from '@recipe/stores';
import { TAG_FIELDS } from '@recipe/graphql/queries/tag';
import { CREATE_TAG } from '@recipe/graphql/mutations/tag';
import { IngredientTags, ReservedTags } from '@recipe/graphql/enums';
import { useDropdown, useSuccessToast, useWarningToast } from '@recipe/common/hooks';

import { useTagSuggestions } from './useTagSuggestions';
import { displayCalculatedTag } from '../utils/displayCalculatedTag';

export function useTagDropdown(
    listRef: RefObject<HTMLUListElement>,
    inputRef: RefObject<HTMLInputElement>
) {
    const successToast = useSuccessToast();
    const warningToast = useWarningToast();
    const setAndSubmit = useRecipeStore((state) => state.setAndSubmitTag);
    const hideDropdown = useRecipeStore((state) => state.hideTagsDropdown);
    const finished = useRecipeStore((state) => state.finishedTags);
    const editable = useRecipeStore((state) => state.editableTag);
    const suggestions = useTagSuggestions(finished, editable);
    const { active, handleSetActive, handleKeyboardEvent } = useDropdown(suggestions, listRef);
    const [createNewTag] = useMutation(CREATE_TAG, {
        variables: { record: { value: editable } },
        onCompleted: (data) => {
            setAndSubmit(data!.tagCreateOne!.record!.value, data!.tagCreateOne!.record!._id, true);
            hideDropdown();
            successToast({
                title: 'Tag created',
                description: `Tag ${data?.tagCreateOne?.record?.value} created`,
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            cache.modify({
                fields: {
                    tagMany(existingTags = []) {
                        try {
                            const newTagRef = cache.writeFragment({
                                data: data?.tagCreateOne?.record,
                                fragment: TAG_FIELDS,
                                fragmentName: 'TagFields',
                            });
                            return [...existingTags, newTagRef];
                        } catch (error) {
                            console.error('Error writing fragment to cache', error);
                            return existingTags;
                        }
                    },
                },
            });
        },
    });

    const handleSelect = (item: TagChoice) => {
        if (item === undefined) {
            const normalizedEditable = editable.toLowerCase();
            const normalizedReservedRecipeTags = Object.values(ReservedTags).map((tag) =>
                displayCalculatedTag(tag).toLowerCase()
            );

            if (Object.values(IngredientTags).includes(normalizedEditable as IngredientTags)) {
                warningToast({
                    title: 'Reserved tag',
                    description: `${editable} tag is automatically determined from ingredients.`,
                    position: 'top',
                });
                return;
            }

            if (normalizedReservedRecipeTags.includes(normalizedEditable)) {
                warningToast({
                    title: 'Reserved tag',
                    description: `${editable} is a reserved tag.`,
                    position: 'top',
                });
                return;
            }

            if (finished.map((tag) => tag.value).includes(editable)) {
                warningToast({
                    title: 'Tag already exists',
                    description: `Cannot add duplicate tags.`,
                    position: 'top',
                });
            } else {
                createNewTag();
            }
        } else {
            setAndSubmit(item.value, item._id);
            hideDropdown();
        }
        inputRef.current?.blur();
    };

    const onKeyDown = (e: KeyboardEvent) => {
        handleKeyboardEvent(e, handleSelect);
    };

    return { suggestions, active, handleSetActive, onKeyDown, handleSelect };
}
