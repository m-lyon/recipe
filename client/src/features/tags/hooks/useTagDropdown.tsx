import { matchSorter } from 'match-sorter';
import { KeyboardEvent, RefObject } from 'react';
import { useMutation, useQuery } from '@apollo/client';

import { useRecipeStore } from '@recipe/stores';
import { CREATE_TAG } from '@recipe/graphql/mutations/tag';
import { GET_TAGS, TAG_FIELDS } from '@recipe/graphql/queries/tag';
import { useDropdown, useSuccessToast, useWarningToast } from '@recipe/common/hooks';

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
    const { data } = useQuery(GET_TAGS);
    const tags = data ? data.tagMany : [];
    const suggestions = matchSorter<TagChoice>(
        tags.filter((tag) => !finished.find((fin) => fin._id === tag._id)),
        editable,
        { keys: ['value'] }
    );
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
