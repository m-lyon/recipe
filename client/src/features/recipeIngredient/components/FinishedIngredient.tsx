import { Tag } from '@chakra-ui/react';
import { Reorder } from 'framer-motion';

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
            <Tag.Root
                size='lg'
                marginBottom='5px'
                maxWidth='80%'
                aria-label={`${tagQuantity}${rest.trim()}`}
            >
                <span style={{ display: 'flex', flexDirection: 'row' }}>
                    <Tag.Label
                        display={quantity ? 'inline-block' : 'none'}
                        py={1}
                        lineHeight={1.3}
                        flexShrink={0}
                        whiteSpace={'pre-wrap'}
                    >
                        {tagQuantity}
                    </Tag.Label>
                    <Tag.Label display='inline-block' py={1} lineHeight={1.3}>
                        {rest}
                    </Tag.Label>
                </span>
                <Tag.EndElement>
                    <Tag.CloseTrigger
                        onClick={() => removeFinished()}
                        aria-label={`Remove ${quantity}${rest}`}
                    />
                </Tag.EndElement>
            </Tag.Root>
        </Reorder.Item>
    );
}
