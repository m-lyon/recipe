import { RefObject } from 'react';
import { matchSorter } from 'match-sorter';
import { LayoutGroup } from 'framer-motion';
import { useMutation } from '@apollo/client';

import { TAG_FIELDS } from '@recipe/graphql/queries/tag';
import { DropdownItem } from '@recipe/common/components';
import { CREATE_TAG } from '@recipe/graphql/mutations/tag';
import { useNavigatableList, useSuccessToast, useWarningToast } from '@recipe/common/hooks';

import { FinishedTag, SetAndSubmit } from '../hooks/useTagList';

interface Props {
    strValue: string;
    tags: TagChoice[];
    setAndSubmit: SetAndSubmit;
    inputRef: RefObject<HTMLInputElement>;
    selectedTags: FinishedTag[];
}
export function TagDropdownList(props: Props) {
    const { strValue, tags, setAndSubmit, inputRef, selectedTags } = props;
    const successToast = useSuccessToast();
    const warningToast = useWarningToast();
    const [createNewTag] = useMutation(CREATE_TAG, {
        variables: {
            record: {
                value: strValue,
            },
        },
        onCompleted: (data) => {
            setAndSubmit(data!.tagCreateOne!.record!.value, data?.tagCreateOne?.record?._id, true);
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
    const suggestions = matchSorter<TagChoice>(
        tags.filter((tag) => {
            return !selectedTags.find((selectedTag) => selectedTag._id === tag._id);
        }),
        strValue,
        { keys: ['value'] }
    );

    const handleSelect = (item: TagChoice) => {
        setAndSubmit(item.value, item._id);
        inputRef.current?.blur();
    };

    const handleOutsideEnter = () => {
        if (selectedTags.map((tag) => tag.value).includes(strValue)) {
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
