import { Reorder } from 'framer-motion';
import { Tag, TagCloseButton, TagLabel } from '@chakra-ui/react';

import { getFinishedRecipeIngredientParts } from '@recipe/utils/formatting';

interface Props {
    item: FinishedRecipeIngredient;
    removeFinished: () => void;
}
export function FinishedIngredient(props: Props) {
    const { item, removeFinished } = props;
    const { quantity, rest } = getFinishedRecipeIngredientParts(item);
    const tagQuantity = `${quantity}${rest.startsWith(' ') ? ' ' : ''}`;
    return (
        <Reorder.Item
            value={item}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Tag
                size='lg'
                marginBottom='5px'
                maxWidth='80%'
                aria-label={`${tagQuantity}${rest.trim()}`}
            >
                <span style={{ display: 'flex', flexDirection: 'row' }}>
                    <TagLabel
                        display={quantity ? 'inline-block' : 'none'}
                        py={1}
                        lineHeight={1.3}
                        flexShrink={0}
                        whiteSpace={'pre-wrap'}
                    >
                        {tagQuantity}
                    </TagLabel>
                    <TagLabel display='inline-block' py={1} lineHeight={1.3}>
                        {rest}
                    </TagLabel>
                </span>
                <TagCloseButton
                    onClick={() => removeFinished()}
                    aria-label={`Remove ${quantity}${rest}`}
                />
            </Tag>
        </Reorder.Item>
    );
}
