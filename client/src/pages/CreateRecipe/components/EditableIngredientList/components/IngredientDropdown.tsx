import { Box, List } from '@chakra-ui/react';
import { Dispatch, SetStateAction, MutableRefObject } from 'react';
import { UseBooleanActions } from '../../../../../types/chakra';
import { InputState } from '../../../hooks/useIngredientList';
import { motion, LayoutGroup } from 'framer-motion';
import { useQuery } from '@apollo/client';
import { gql } from '../../../../../__generated__/gql';
import { IngredientNameDropdownList } from './IngredientNameDropdownList';
import { UnitDropdownList } from './UnitDropdownList';
import { PrepMethodDropdownList } from './PrepMethodDropdownList';

export const GET_INGREDIENT_OPTS = gql(`
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

interface Props {
    inputState: InputState;
    show: boolean;
    setShow: UseBooleanActions;
    currentValue: string | null;
    setItem: (value: string | null, _id?: string) => void;
    setIsSelecting: Dispatch<SetStateAction<boolean>>;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
    handleSubmit: () => void;
    setIsComplete: (val: boolean) => void;
}
export function IngredientDropdown(props: Props) {
    const {
        inputState,
        show,
        setShow,
        currentValue,
        setItem,
        setIsSelecting,
        inputRef,
        previewRef,
        handleSubmit,
        setIsComplete,
    } = props;
    const { loading, error, data } = useQuery(GET_INGREDIENT_OPTS);
    const strValue = currentValue ? currentValue : '';

    const getSuggestionsList = () => {
        if (!data) {
            return [];
        }
        const dropdownProps = {
            strValue,
            data,
            setItem,
            setIsSelecting,
            inputRef,
            previewRef,
        };
        switch (inputState) {
            case 'unit':
                return <UnitDropdownList {...dropdownProps} />;
            case 'name':
                return <IngredientNameDropdownList {...dropdownProps} />;
            case 'prepMethod':
                return (
                    <PrepMethodDropdownList
                        {...dropdownProps}
                        handleSubmit={() => {
                            setIsSelecting(false);
                            setIsComplete(true);
                            setShow.off();
                            handleSubmit();
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
