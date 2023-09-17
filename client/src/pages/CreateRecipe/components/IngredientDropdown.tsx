import { Box, List } from '@chakra-ui/react';
import { Dispatch, SetStateAction } from 'react';
import { UseBooleanActions } from '../../../types/chakra';
import { InputState } from '../hooks/useIngredientList';
import { motion, LayoutGroup } from 'framer-motion';
import { useQuery } from '@apollo/client';
import { gql } from '../../../__generated__/gql';
import { matchSorter } from 'match-sorter';
import { GetIngredientOptsQuery, Ingredient } from '../../../__generated__/graphql';
import { Unit, PrepMethod } from '../../../__generated__/graphql';
import { IngredientPropList, PropListOpt } from './IngredientPropList';

const GET_INGREDIENT_OPTS = gql(`
    query GetIngredientOpts {
        ingredientMany {
            _id
            name
        }
        unitMany {
            _id
            shortSingular
            shortPlural
            longSingular
            longPlural
        }
        prepMethodMany {
            _id
            value
        }
    }
`);

function getFilteredUnitItems(data: GetIngredientOptsQuery, value: string): PropListOpt[] {
    const items = matchSorter<Unit>(data.unitMany, value, {
        keys: ['longSingular', 'longPlural'],
    }).map((item) => {
        return {
            value: item.longSingular,
            colour: undefined,
            _id: item._id,
        };
    }) as PropListOpt[];
    items.unshift({ value: 'skip unit', colour: 'gray.400', _id: undefined });
    items.push({ value: 'add new unit', colour: 'gray.400', _id: undefined });
    return items;
}

function getFilteredNameItems(data: GetIngredientOptsQuery, value: string): PropListOpt[] {
    const items = matchSorter<Ingredient>(data.ingredientMany, value, {
        keys: ['name'],
    }).map((item) => {
        return {
            value: item.name,
            colour: undefined,
            _id: item._id,
        };
    }) as PropListOpt[];
    items.push({ value: 'add new ingredient', colour: 'gray.400', _id: undefined });
    return items;
}

function getFilteredPrepMethodItems(data: GetIngredientOptsQuery, value: string): PropListOpt[] {
    const items = matchSorter<PrepMethod>(data.prepMethodMany, value, {
        keys: ['value'],
    }) as PropListOpt[];
    items.unshift({ value: 'skip prep method', colour: 'gray.400', _id: undefined });
    items.push({ value: 'add new prep method', colour: 'gray.400', _id: undefined });
    return items;
}

interface Props {
    inputState: InputState;
    show: boolean;
    setShow: UseBooleanActions;
    currentValue: string | null;
    setItem: (value: string | null, _id?: string) => void;
    setIsSelecting: Dispatch<SetStateAction<boolean>>;
    blurCallback: () => void;
}
export function IngredientDropdown(props: Props) {
    const { inputState, show, setShow, currentValue, setItem, setIsSelecting, blurCallback } =
        props;
    const { loading, error, data } = useQuery(GET_INGREDIENT_OPTS);
    const strValue = currentValue ? currentValue : '';

    const getSuggestionsList = () => {
        if (!data) {
            return [];
        }
        const genericProps = {
            strValue,
            data,
            setItem,
            setIsSelecting,
        };
        switch (inputState) {
            case 'unit':
                return <IngredientPropList {...genericProps} filter={getFilteredUnitItems} />;
            case 'name':
                return <IngredientPropList {...genericProps} filter={getFilteredNameItems} />;
            case 'prepMethod':
                return (
                    <IngredientPropList
                        {...genericProps}
                        filter={getFilteredPrepMethodItems}
                        handleSubmitCallback={() => {
                            setShow.off();
                            blurCallback();
                            setIsSelecting(false);
                        }}
                    />
                );
            default:
                return [];
        }
    };

    return (
        inputState !== 'quantity' &&
        show && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Box pb={4} mb={4}>
                    <List
                        color='rgba(0, 0, 0, 0.64)'
                        bg='white'
                        borderRadius='4px'
                        borderBottom={show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        borderLeft={show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        borderRight={show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        boxShadow='6px 5px 8px rgba(0,50,30,0.02)'
                    >
                        <LayoutGroup>{getSuggestionsList()}</LayoutGroup>
                    </List>
                </Box>
            </motion.div>
        )
    );
}
