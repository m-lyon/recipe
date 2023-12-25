import { Box, List } from '@chakra-ui/react';
import { motion, LayoutGroup } from 'framer-motion';
import { MutableRefObject } from 'react';
import { EditableIngredient, IngredientActionHandler } from '../../../hooks/useIngredientList';
import { QueryData } from '../../../hooks/useIngredientList';
import { IngredientNameDropdownList } from './IngredientNameDropdownList';
import { UnitDropdownList } from './UnitDropdownList';
import { PrepMethodDropdownList } from './PrepMethodDropdownList';
import { isPlural } from '../../../../../utils/plural';

interface Props {
    item: EditableIngredient;
    actionHandler: IngredientActionHandler;
    queryData: QueryData;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
}
export function IngredientDropdown(props: Props) {
    const { item, actionHandler, queryData, inputRef, previewRef } = props;

    const currentValue = actionHandler.get.currentStateValue();

    const getSuggestionsList = () => {
        const dropdownProps = {
            strValue: currentValue ? currentValue : '',
            setItem: actionHandler.set.currentStateItem,
            inputRef,
            previewRef,
        };
        switch (item.state) {
            case 'unit':
                if (!queryData.unit) {
                    return [];
                }
                return (
                    <UnitDropdownList
                        data={queryData.unit}
                        isPlural={isPlural(item.quantity)}
                        {...dropdownProps}
                    />
                );
            case 'name':
                if (!queryData.ingredient) {
                    console.log('no ingredient data');
                    return [];
                }
                return (
                    <IngredientNameDropdownList
                        data={queryData.ingredient}
                        plural={isPlural(item.quantity)}
                        hasUnit={item.unit.value !== null}
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
                            actionHandler.set.show.off();
                            actionHandler.handleSubmit();
                        }}
                    />
                );
            default:
                return [];
        }
    };

    return (
        item.state !== 'quantity' &&
        item.show && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Box pb={4} mb={4}>
                    <List
                        color='rgba(0, 0, 0, 0.64)'
                        bg='white'
                        borderRadius='4px'
                        borderBottom={item.show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        borderLeft={item.show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        borderRight={item.show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        boxShadow='6px 5px 8px rgba(0,50,30,0.02)'
                    >
                        <LayoutGroup>{getSuggestionsList()}</LayoutGroup>
                    </List>
                </Box>
            </motion.div>
        )
    );
}
