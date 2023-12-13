import { Box, List } from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import { motion, LayoutGroup } from 'framer-motion';
import { Dispatch, SetStateAction, MutableRefObject } from 'react';
import { EditableIngredient, IngredientActionHandler } from '../../../hooks/useIngredientList';
import { gql } from '../../../../../__generated__/gql';
import { IngredientNameDropdownList } from './IngredientNameDropdownList';
import { UnitDropdownList } from './UnitDropdownList';
import { PrepMethodDropdownList } from './PrepMethodDropdownList';

export const GET_UNITS = gql(`
    query GetUnits {
        unitMany {
            _id
            shortSingular
            shortPlural
            longSingular
            longPlural
        }
    }
`);

export const GET_INGREDIENTS = gql(`
    query GetIngredients {
        ingredientMany {
            _id
            name
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

function isPlural(quantity: string | null): boolean {
    if (quantity === null) {
        return false;
    }

    // Check if the quantity is a fraction in the form x/y
    const fractionRegex = /^\s*(\d+)\s*\/\s*(\d+)\s*$/;
    const fractionMatch = quantity.match(fractionRegex);

    if (fractionMatch) {
        // If it's a fraction, return false (considered singular)
        return false;
    }

    // If it's not a fraction, try parsing as a number and check if it's not 1
    const num = parseFloat(quantity);
    return num !== 1;
}

interface Props {
    item: EditableIngredient;
    actionHandler: IngredientActionHandler;
    setIsSelecting: Dispatch<SetStateAction<boolean>>;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
    setIsComplete: (val: boolean) => void;
}
export function IngredientDropdown(props: Props) {
    const { item, actionHandler, setIsSelecting, setIsComplete, inputRef, previewRef } = props;
    const { data: unitData } = useQuery(GET_UNITS);
    const { data: ingredientData } = useQuery(GET_INGREDIENTS);
    const { data: prepMethodData } = useQuery(GET_PREP_METHODS);

    const currentValue = actionHandler.get.currentStateValue();

    const getSuggestionsList = () => {
        const dropdownProps = {
            strValue: currentValue ? currentValue : '',
            setItem: actionHandler.set.currentStateItem,
            setIsSelecting,
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
                    return [];
                }
                return <IngredientNameDropdownList data={ingredientData} {...dropdownProps} />;
            case 'prepMethod':
                if (!prepMethodData) {
                    return [];
                }
                return (
                    <PrepMethodDropdownList
                        data={prepMethodData}
                        {...dropdownProps}
                        handleSubmit={() => {
                            setIsSelecting(false);
                            setIsComplete(true);
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
