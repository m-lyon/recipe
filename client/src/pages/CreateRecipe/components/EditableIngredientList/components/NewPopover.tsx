import { PopoverHeader } from '@chakra-ui/react';
import { PopoverArrow } from '@chakra-ui/react';
import { PopoverCloseButton } from '@chakra-ui/react';
import { PopoverContent } from '@chakra-ui/react';
import { NewFormProps } from '../../../types';

interface Props {
    NewForm: React.FC<NewFormProps>;
    formProps: NewFormProps;
    title: string;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
}
export function NewPopover(props: Props) {
    const { NewForm, formProps, title, paddingRight, paddingBottom, paddingLeft } = props;
    return (
        <PopoverContent
            paddingRight={paddingRight == null ? 4 : paddingRight}
            paddingBottom={paddingBottom == null ? 3 : paddingBottom}
            paddingLeft={paddingLeft == null ? 2 : paddingLeft}
        >
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader border={'hidden'}>{title}</PopoverHeader>
            <NewForm {...formProps} />
        </PopoverContent>
    );
}
