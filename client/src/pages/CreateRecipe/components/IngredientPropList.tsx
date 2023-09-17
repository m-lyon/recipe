import { LayoutGroup } from 'framer-motion';
import { GetIngredientOptsQuery } from '../../../__generated__/graphql';
import { DropdownItem } from '../../../components/DropdownItem';

export interface PropListOpt {
    value: string;
    colour?: string;
    _id: undefined;
}
interface Props {
    strValue: string;
    data: GetIngredientOptsQuery;
    setItem: (value: string | null, _id?: string) => void;
    setIsSelecting: (value: boolean) => void;
    filter: (data: GetIngredientOptsQuery, value: string) => Array<PropListOpt>;
    handleSubmitCallback?: () => void;
    listRef?: any;
    focusedItemRef?: any;
}
export function IngredientPropList(props: Props) {
    const { strValue, data, setItem, setIsSelecting, filter, handleSubmitCallback } = props;
    const suggestions = filter(data, strValue);

    const listItems = suggestions.map((item, index) => {
        let onClick: () => void;
        if (item.value.startsWith('skip ')) {
            onClick = () => {
                setItem(null);
                if (typeof handleSubmitCallback !== 'undefined') {
                    handleSubmitCallback();
                }
            };
        } else if (item.value.startsWith('add new ')) {
            onClick = () => setItem(null); // TODO
        } else {
            onClick = () => {
                setItem(item.value, item._id);
                if (typeof handleSubmitCallback !== 'undefined') {
                    console.log('handleSubmitCallback');
                    handleSubmitCallback();
                }
            };
        }
        return (
            <DropdownItem
                key={index}
                color={item.colour}
                value={item.value}
                onClick={onClick}
                setIsSelecting={setIsSelecting}
            />
        );
    });

    return <LayoutGroup>{listItems}</LayoutGroup>;
}
