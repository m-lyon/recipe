import { MutableRefObject } from 'react';
import { Box, List } from '@chakra-ui/react';
import { motion, LayoutGroup } from 'framer-motion';

import { UnitDropdownList } from './UnitDropdownList';
import { QueryData } from '../../../hooks/useIngredientList';
import { QuantityDropdownList } from './QuantityDropdownList';
import { PrepMethodDropdownList } from './PrepMethodDropdownList';
import { IngredientActionHandler } from '../../../hooks/useIngredientList';
import { EditableRecipeIngredient } from '../../../hooks/useIngredientList';
import { IngredientDropdownList, IngredientOrRecipe } from './IngredientDropdownList';

interface Props {
    item: EditableRecipeIngredient;
    actionHandler: IngredientActionHandler;
    queryData: QueryData;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
}
export function RecipeIngredientDropdown(props: Props) {
    const { item, actionHandler, queryData, inputRef, previewRef } = props;
    const currentValue = actionHandler.currentEditableAttributeValue();

    const getSuggestionsList = () => {
        const dropdownProps = {
            strValue: currentValue ? currentValue : '',
            setItem: actionHandler.setCurrentEditableAttribute,
            inputRef,
            previewRef,
        };
        switch (item.state) {
            case 'quantity':
                return <QuantityDropdownList {...dropdownProps} />;
            case 'unit':
                if (!queryData.unit) {
                    return [];
                }
                return (
                    <UnitDropdownList
                        data={queryData.unit}
                        quantity={item.quantity}
                        {...dropdownProps}
                    />
                );
            case 'ingredient':
                if (!queryData.ingredient) {
                    return [];
                }
                //@ts-ignore
                const data: IngredientOrRecipe[] = queryData.ingredient.concat(queryData.recipe!);
                return (
                    <IngredientDropdownList
                        data={data}
                        quantity={item.quantity}
                        unit={item.unit.data!}
                        {...dropdownProps}
                    />
                );
            case 'prepMethod':
                if (!queryData.prepMethod) {
                    return [];
                }
                return (
                    <PrepMethodDropdownList
                        data={queryData.prepMethod}
                        {...dropdownProps}
                        handleSubmit={() => {
                            actionHandler.setEditableShow.off();
                            actionHandler.handleEditableSubmit();
                        }}
                    />
                );
            default:
                return [];
        }
    };

    return (
        item.show && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Box pb={4} mb={4} zIndex={1} position='absolute' width='100%'>
                    <List
                        color='rgba(0, 0, 0, 0.64)'
                        bg='white'
                        borderRadius='4px'
                        borderBottom={item.show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        borderLeft={item.show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        borderRight={item.show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        boxShadow='6px 5px 8px rgba(0,50,30,0.02)'
                        maxHeight={item.show ? '14em' : undefined}
                        overflowY={item.show ? 'auto' : undefined}
                    >
                        <LayoutGroup>{getSuggestionsList()}</LayoutGroup>
                    </List>
                </Box>
            </motion.div>
        )
    );
}
