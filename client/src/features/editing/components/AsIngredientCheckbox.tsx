import { useShallow } from 'zustand/shallow';
import { Checkbox, Collapse, Divider, Group, Stack, TextInput } from '@mantine/core';

import { useRecipeStore } from '@recipe/stores';

export function AsIngredientCheckbox() {
    const {
        isIngredient,
        pluralTitle,
        toggleIsIngredient,
        setPluralTitle,
        prepAhead,
        prepAheadLabel,
        togglePrepAhead,
        setPrepAheadLabel,
    } = useRecipeStore(
        useShallow((state) => ({
            isIngredient: state.isIngredient,
            pluralTitle: state.pluralTitle,
            toggleIsIngredient: state.toggleIsIngredient,
            setPluralTitle: state.setPluralTitle,
            prepAhead: state.prepAhead,
            prepAheadLabel: state.prepAheadLabel,
            togglePrepAhead: state.togglePrepAhead,
            setPrepAheadLabel: state.setPrepAheadLabel,
        }))
    );

    return (
        <Group grow align='flex-start' gap='md' style={{ width: '100%' }}>
            <Stack gap='xs'>
                <Checkbox
                    checked={isIngredient}
                    onChange={toggleIsIngredient}
                    label='Register recipe as ingredient'
                    aria-label='Toggle recipe as ingredient'
                />
                <Collapse in={isIngredient}>
                    <TextInput
                        placeholder='Plural title'
                        value={pluralTitle ?? ''}
                        onChange={(e) => setPluralTitle(e.currentTarget.value)}
                        variant='unstyled'
                        aria-label='Edit recipe plural title'
                    />
                </Collapse>
            </Stack>
            <Divider orientation='vertical' visibleFrom='md' />
            <Divider orientation='horizontal' hiddenFrom='md' />
            <Stack gap='xs'>
                <Checkbox
                    checked={prepAhead}
                    onChange={togglePrepAhead}
                    label='Prep ahead'
                    aria-label='Toggle prep ahead'
                    disabled={!isIngredient}
                />
                <Collapse in={prepAhead && isIngredient}>
                    <TextInput
                        placeholder='How far ahead?'
                        value={prepAheadLabel ?? ''}
                        onChange={(e) => setPrepAheadLabel(e.currentTarget.value)}
                        variant='unstyled'
                        aria-label='Edit prep ahead label'
                        disabled={!isIngredient}
                    />
                </Collapse>
            </Stack>
        </Group>
    );
}
