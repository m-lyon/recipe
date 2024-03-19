import { LayoutGroup } from 'framer-motion';
import { Tag } from '../../../__generated__/graphql';
import { DropdownItem } from '../../../components/DropdownItem';
import { MutableRefObject } from 'react';
import { useNavigatableList } from '../hooks/useNavigatableList';
import { matchSorter } from 'match-sorter';
import { useMutation } from '@apollo/client';
import { FinishedTag, SetAndSubmit } from '../hooks/useTagList';
import { useToast } from '@chakra-ui/react';
import { CREATE_TAG } from '../../../graphql/mutations/tag';

interface TagSuggestion {
    value: string;
    _id: string;
}

interface Props {
    strValue: string;
    tags: Tag[];
    setAndSubmit: SetAndSubmit;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    selectedTags: FinishedTag[];
}
export function TagDropdownList(props: Props) {
    const { strValue, tags, setAndSubmit, inputRef, selectedTags } = props;
    const toast = useToast();
    const [createNewTag] = useMutation(CREATE_TAG, {
        variables: {
            record: {
                value: strValue,
            },
        },
        onCompleted: (data) => {
            setAndSubmit(data!.tagCreateOne!.record!.value, data?.tagCreateOne?.record?._id, true);
            toast({
                title: 'Tag created',
                description: `Tag ${data?.tagCreateOne?.record?.value} created`,
                status: 'success',
                position: 'top',
                duration: 3000,
                isClosable: true,
            });
        },
        refetchQueries: ['GetTags'],
    });
    const suggestions = matchSorter<Tag>(
        tags.filter((tag) => {
            return !selectedTags.find((selectedTag) => selectedTag._id === tag._id);
        }),
        strValue,
        { keys: ['value'] }
    ).map((tag) => {
        return { value: tag.value, _id: tag._id };
    }) as TagSuggestion[];

    const handleSelect = (item: TagSuggestion) => {
        setAndSubmit(item.value, item._id);
        inputRef.current?.blur();
    };

    const handleOutsideEnter = () => {
        if (selectedTags.map((tag) => tag.value).includes(strValue)) {
            toast({
                title: 'Tag already exists',
                description: `Cannot add duplicate tags.`,
                status: 'warning',
                position: 'top',
                duration: 3000,
                isClosable: true,
            });
        } else {
            createNewTag();
        }
        inputRef.current?.blur();
    };

    const { highlightedIndex, setHighlightedIndex } = useNavigatableList<TagSuggestion>(
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
