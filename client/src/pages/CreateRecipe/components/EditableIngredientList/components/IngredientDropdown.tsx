import { Box, List } from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import { motion, LayoutGroup } from 'framer-motion';
import { MutableRefObject } from 'react';
import { EditableIngredient, IngredientActionHandler } from '../../../hooks/useIngredientList';
import { gql } from '../../../../../__generated__/gql';
import { IngredientNameDropdownList } from './IngredientNameDropdownList';
import { UnitDropdownList } from './UnitDropdownList';
import { PrepMethodDropdownList } from './PrepMethodDropdownList';
import { GetUnitsQuery } from '../../../../../__generated__/graphql';
import { isPlural } from '../../../../../utils/plural';

export const GET_INGREDIENTS = gql(`
    query GetIngredients {
        ingredientMany {
            _id
            name
            pluralName
            isCountable
        }
    }
`);

export const GET_PREP_METHODS = gql(`
    query GetPrepMethods {
        prepMethodMany {
            _id
            value
        }
    }
`);

interface Props {
    item: EditableIngredient;
    actionHandler: IngredientActionHandler;
    unitData?: GetUnitsQuery;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
}
export function IngredientDropdown(props: Props) {
    const { item, actionHandler, unitData, inputRef, previewRef } = props;
    const { data: ingredientData } = useQuery(GET_INGREDIENTS);
    const { data: prepMethodData } = useQuery(GET_PREP_METHODS);

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
                if (!unitData) {
                    return [];
                }
                return (
                    <UnitDropdownList
                        data={unitData}
                        isPlural={isPlural(item.quantity)}
                        {...dropdownProps}
                    />
                );
            case 'name':
                if (!ingredientData) {
                    console.log('no ingredient data');
                    return [];
                }
                return (
                    <IngredientNameDropdownList
                        data={ingredientData}
                        isPlural={isPlural(item.quantity)}
                        hasUnit={item.unit.value !== null}
                        {...dropdownProps}
                    />
                );
            case 'prepMethod':
                if (!prepMethodData) {
                    return [];
                }
                return (
                    <PrepMethodDropdownList
                        data={prepMethodData}
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
