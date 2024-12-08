import { RefObject } from 'react';
import { matchSorter } from 'match-sorter';
import { LayoutGroup } from 'framer-motion';
import { useShallow } from 'zustand/shallow';
import { useMutation, useQuery } from '@apollo/client';

import { useRecipeStore } from '@recipe/stores';
import { DropdownItem } from '@recipe/common/components';
import { CREATE_TAG } from '@recipe/graphql/mutations/tag';
import { GET_TAGS, TAG_FIELDS } from '@recipe/graphql/queries/tag';
import { useNavigatableList, useSuccessToast, useWarningToast } from '@recipe/common/hooks';

interface Props {
    inputRef: RefObject<HTMLInputElement>;
}
export function TagDropdownList(props: Props) {
    const { inputRef } = props;
    const successToast = useSuccessToast();
    const warningToast = useWarningToast();
    const { data } = useQuery(GET_TAGS);
    const { setAndSubmit, hideDropdown, editableTag, finishedTags } = useRecipeStore(
        useShallow((state) => ({
            setAndSubmit: state.setAndSubmitTag,
            hideDropdown: state.hideTagsDropdown,
            editableTag: state.editableTag,
            finishedTags: state.finishedTags,
        }))
    );
    const [createNewTag] = useMutation(CREATE_TAG, {
        variables: {
            record: {
                value: editableTag,
            },
        },
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
    const tags = data ? data.tagMany : [];
    const suggestions = matchSorter<TagChoice>(
        tags.filter((tag) => !finishedTags.find((finishedTag) => finishedTag._id === tag._id)),
        editableTag,
        { keys: ['value'] }
    );

    const handleSelect = (item: TagChoice) => {
        setAndSubmit(item.value, item._id);
        hideDropdown();
        inputRef.current?.blur();
    };

    const handleOutsideEnter = () => {
        if (finishedTags.map((tag) => tag.value).includes(editableTag)) {
            warningToast({
                title: 'Tag already exists',
                description: `Cannot add duplicate tags.`,
                position: 'top',
            });
        } else {
            createNewTag();
        }
        inputRef.current?.blur();
    };

    const { highlightedIndex, setHighlightedIndex } = useNavigatableList<TagChoice>(
        suggestions,
        handleSelect,
        inputRef,
        handleOutsideEnter
    );

    const listItems = suggestions.map((item, index) => {
        return (
            <DropdownItem
                key={index}
                value={item.value}
                onClick={() => handleSelect(item)}
                isHighlighted={index === highlightedIndex}
                setHighlighted={() => setHighlightedIndex(index)}
                resetHighlighted={() => setHighlightedIndex(-1)}
            />
        );
    });

    return <LayoutGroup>{listItems}</LayoutGroup>;
}
