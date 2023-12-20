import { Reorder } from 'framer-motion';
import { Tag, TagLabel, TagCloseButton } from '@chakra-ui/react';
import { FinishedIngredient as FinishedIngredientType } from '../../../hooks/useIngredientList';
import { getFinishedIngredientStr } from '../../../hooks/useIngredientList';

interface Props {
    index: number;
    item: FinishedIngredientType;
    removeFinished: (index: number) => void;
}
export function FinishedIngredient(props: Props) {
    const { index, item, removeFinished } = props;
    const ingrStr = getFinishedIngredientStr(item);
    return (
        <Reorder.Item
            value={item}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Tag size='lg' marginBottom='5px'>
                <TagLabel>{ingrStr}</TagLabel>
                <TagCloseButton onClick={() => removeFinished(index)} />
            </Tag>
        </Reorder.Item>
    );
}
