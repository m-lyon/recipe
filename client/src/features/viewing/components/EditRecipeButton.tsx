import { Link } from 'react-router-dom';
import { MdEdit } from 'react-icons/md';
import { ActionIcon, Tooltip } from '@mantine/core';

import { PATH } from '@recipe/constants';

interface Props {
    titleIdentifier: string;
    recipeTitle: string;
}

export function EditRecipeButton({ titleIdentifier, recipeTitle }: Props) {
    return (
        <Tooltip label={`Edit ${recipeTitle}`} openDelay={500}>
            <ActionIcon
                variant='subtle'
                size='lg'
                aria-label={`Edit ${recipeTitle}`}
                component={Link}
                to={`${PATH.ROOT}/edit/recipe/${titleIdentifier}`}
            >
                <MdEdit size={20} />
            </ActionIcon>
        </Tooltip>
    );
}
