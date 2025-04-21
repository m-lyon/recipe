import { useShallow } from 'zustand/shallow';
import { Box, Button, Center } from '@chakra-ui/react';

import { useRecipeStore } from '@recipe/stores';
import { useErrorToast } from '@recipe/common/hooks';
import { CreateOneRecipeCreateInput } from '@recipe/graphql/generated';

interface Props {
    submitText: string;
    loadingText?: string;
    disabled?: boolean;
    loading?: boolean;
    handleSubmit: (recipe: CreateOneRecipeCreateInput) => void;
    isLoggedIn: boolean;
}
export function SubmitButton(props: Props) {
    const { submitText, loadingText, disabled, loading, handleSubmit, isLoggedIn } = props;
    const toast = useErrorToast();
    const { isIngredient, pluralTitle, source, title, notes, servings, tags, instr, ingr } =
        useRecipeStore(
            useShallow((state) => ({
                source: state.source,
                title: state.title,
                notes: state.notes,
                isIngredient: state.isIngredient,
                pluralTitle: state.pluralTitle,
                servings: state.numServings,
                tags: state.finishedTags,
                instr: state.instructionSections,
                ingr: state.ingredientSections,
            }))
        );

    const validate = () => {
        if (title.trim() == '') {
            toast({ title: 'Please enter a title', position: 'top' });
            return false;
        }
        // first ingredient section must have at least one ingredient
        if (ingr[0].finished.length === 0) {
            toast({ title: 'Please enter at least one ingredient', position: 'top' });
            return false;
        }
        // first instruction section must have at least one instruction
        if (instr[0].instructions.length === 0) {
            toast({ title: 'Please enter at least one instruction', position: 'top' });
            return false;
        }
        const validIngredientSections = ingr.filter(
            (section) => section.name || section.finished.length > 0
        );
        const validInstructionSections = instr.filter(
            (section) =>
                section.name ||
                section.instructions.filter((line) => line.value.trim() !== '').length > 0
        );
        // if there are two or more non empty sections, they must all have names
        if (
            validIngredientSections.length > 1 &&
            validIngredientSections.some((section) => !section.name || section.name.trim() === '')
        ) {
            toast({ title: 'Please enter a name for each ingredient subsection', position: 'top' });
            return false;
        }
        if (
            validInstructionSections.length > 1 &&
            validInstructionSections.some((section) => !section.name || section.name.trim() === '')
        ) {
            toast({
                title: 'Please enter a name for each instruction subsection',
                position: 'top',
            });
            return false;
        }
        // if there are two or more non empty sections, they must all have at least one ingredient
        if (
            validIngredientSections.length > 1 &&
            validIngredientSections.some((section) => section.finished.length === 0)
        ) {
            toast({
                title: 'Please enter at least one ingredient for each subsection',
                position: 'top',
            });
            return false;
        }
        if (
            validInstructionSections.length > 1 &&
            validInstructionSections.some(
                (section) =>
                    section.instructions.filter((line) => line.value.trim() !== '').length === 0
            )
        ) {
            toast({
                title: 'Please enter at least one instruction for each subsection',
                position: 'top',
            });
            return false;
        }
        return true;
    };

    const onSubmit = () => {
        if (!validate()) {
            return;
        }
        const ingredientSubsections = ingr
            .filter((section) => section.name || section.finished.length > 0)
            .map((section) => {
                return {
                    name: section.name,
                    ingredients: section.finished.map((item) => {
                        return {
                            quantity: item.quantity ? item.quantity : undefined,
                            unit: item.unit ? item.unit._id : undefined,
                            size: item.size ? item.size._id : undefined,
                            ingredient: item.ingredient._id,
                            prepMethod: item.prepMethod ? item.prepMethod._id : undefined,
                        } satisfies SubmittableRecipeIngredient;
                    }),
                };
            });
        const instructionSubsections = instr
            .filter(
                (section) =>
                    section.name ||
                    section.instructions.filter((line) => line.value.trim() !== '').length > 0
            )
            .map((section) => {
                return {
                    name: section.name,
                    instructions: section.instructions
                        .filter((line) => line.value.trim() !== '')
                        .map((line) => line.value.trimEnd())
                        .map((value) => (/[.!?]$/.test(value) ? value : value + '.')),
                };
            });
        if (!isLoggedIn) {
            toast({ title: 'Please log in to create a recipe', position: 'top' });
            return;
        }
        const recipe = {
            numServings: servings,
            title,
            pluralTitle: isIngredient ? (pluralTitle ? pluralTitle : title) : undefined,
            instructionSubsections,
            ingredientSubsections,
            tags: tags.map((tag) => tag._id),
            notes: notes
                ? /[.!?]$/.test(notes.trimEnd())
                    ? notes.trimEnd()
                    : notes.trimEnd() + '.'
                : undefined,
            source: source ? source : undefined,
            isIngredient,
        };
        handleSubmit(recipe);
    };
    return (
        <Center>
            <Box position='fixed' bottom='4' pb='3'>
                <Button
                    size='lg'
                    borderRadius='full'
                    aria-label='Save recipe'
                    border='1px'
                    borderColor='gray.200'
                    onClick={onSubmit}
                    loadingText={loadingText}
                    disabled={disabled}
                    loading={loading}
                >
                    {submitText}
                </Button>
            </Box>
        </Center>
    );
}
