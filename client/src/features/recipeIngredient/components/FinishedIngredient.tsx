import { Reorder } from 'framer-motion';
import { Tag, TagCloseButton, TagLabel } from '@chakra-ui/react';

import { FinishedRecipeIngredient } from '@recipe/types';
import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';

interface Props {
    index: number;
    item: FinishedRecipeIngredient;
    removeFinished: (index: number) => void;
}
export function FinishedIngredient(props: Props) {
    const { index, item, removeFinished } = props;
    const ingrStr = getFinishedRecipeIngredientStr(item);
    return (
        <Reorder.Item
            value={item}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Tag size='lg' marginBottom='5px'>
                <TagLabel>{ingrStr}</TagLabel>
                <TagCloseButton
                    onClick={() => removeFinished(index)}
                    aria-label={`Remove ${ingrStr}`}
                />
            </Tag>
        </Reorder.Item>
    );
}
