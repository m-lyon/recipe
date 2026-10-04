import { useEffect, useState } from 'react';
import { CloseIcon } from '@chakra-ui/icons';
import { useMutation, useQuery } from '@apollo/client';
import { NumberInput, NumberInputField, Text, VStack } from '@chakra-ui/react';
import { Box, Button, ButtonGroup, HStack, Heading, IconButton } from '@chakra-ui/react';

import { DisplayLadder } from '@recipe/utils/units';
import { GET_UNITS } from '@recipe/graphql/queries/unit';
import { useErrorToast, useSuccessToast } from '@recipe/common/hooks';
import { GET_DISPLAY_LADDERS } from '@recipe/graphql/queries/displayLadder';
import { CREATE_DISPLAY_LADDER } from '@recipe/graphql/mutations/displayLadder';
import { REMOVE_DISPLAY_LADDER } from '@recipe/graphql/mutations/displayLadder';
import { UPDATE_DISPLAY_LADDER } from '@recipe/graphql/mutations/displayLadder';
import { FloatingLabelInput, SearchableSelect } from '@recipe/common/components';
import { EnumDisplayLadderDimension, EnumDisplayLadderSystem } from '@recipe/graphql/generated';

interface StepDraft {
    unitId: string | null;
    /** The threshold in the step's own unit: "from 1/4 cup" is 0.25. */
    from: string;
}
interface LadderDraft {
    name: string;
    dimension: EnumDisplayLadderDimension;
    system: EnumDisplayLadderSystem;
    steps: StepDraft[];
}

const EMPTY_DRAFT: LadderDraft = {
    name: '',
    dimension: 'mass',
    system: 'metric',
    steps: [{ unitId: null, from: '0' }],
};

function toDraft(ladder: DisplayLadder): LadderDraft {
    return {
        name: ladder.name,
        dimension: ladder.dimension,
        system: ladder.system,
        steps: ladder.steps.map((step) => ({
            unitId: step.unit._id,
            from: String(Number((step.minCanonical / step.unit.perCanonical).toPrecision(6))),
        })),
    };
}

interface Props {
    mode: 'create' | 'edit';
}
/**
 * Display ladders choose which unit a quantity is shown in, within one system: 1500 g is
 * shown as 1.5 kg. Each step applies from a threshold, written in that step's unit.
 */
export function DisplayLadders(props: Props) {
    const { mode } = props;
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [draft, setDraft] = useState<LadderDraft>(EMPTY_DRAFT);
    const { data: unitData } = useQuery(GET_UNITS);
    const { data } = useQuery(GET_DISPLAY_LADDERS);
    const errorToast = useErrorToast();
    const successToast = useSuccessToast();
    const onError = (err: Error) =>
        errorToast({ title: 'An error occurred.', description: err.message, position: 'top' });
    const [createLadder, { loading: creating }] = useMutation(CREATE_DISPLAY_LADDER, {
        refetchQueries: [GET_DISPLAY_LADDERS],
        onError,
        onCompleted: () => {
            successToast({ title: 'Display ladder saved', position: 'top' });
            setDraft(EMPTY_DRAFT);
        },
    });
    const [updateLadder, { loading: updating }] = useMutation(UPDATE_DISPLAY_LADDER, {
        onError,
        onCompleted: () => successToast({ title: 'Display ladder saved', position: 'top' }),
    });
    const [removeLadder, { loading: deleting }] = useMutation(REMOVE_DISPLAY_LADDER, {
        onError,
        update: (cache, { data }) => {
            cache.evict({ id: `DisplayLadder:${data?.displayLadderRemoveById?.recordId}` });
            cache.gc();
        },
        onCompleted: () => {
            successToast({ title: 'Display ladder deleted', position: 'top' });
            setCurrentId(null);
        },
    });

    const current = data?.displayLadderMany.find((ladder) => ladder._id === currentId);
    useEffect(() => {
        setDraft(current ? toDraft(current) : EMPTY_DRAFT);
    }, [current]);

    const units = (unitData?.unitMany ?? []).filter(
        (unit) => unit.dimension === draft.dimension && unit.system === draft.system
    );
    const disabled = mode === 'edit' && !current;

    const setStep = (index: number, step: Partial<StepDraft>) =>
        setDraft((d) => ({
            ...d,
            steps: d.steps.map((s, i) => (i === index ? { ...s, ...step } : s)),
        }));

    const handleSave = () => {
        const steps = draft.steps.map((step) => {
            const unit = units.find((u) => u._id === step.unitId);
            if (!unit) {
                throw new Error('Every step needs a unit of this dimension and system');
            }
            return {
                unit: unit._id,
                minCanonical: (parseFloat(step.from) || 0) * unit.perCanonical,
            };
        });
        const record = {
            name: draft.name,
            dimension: draft.dimension,
            system: draft.system,
            steps,
        };
        if (current) {
            updateLadder({ variables: { id: current._id, record } });
        } else {
            createLadder({ variables: { record: { ...record, scope: 'global' } } });
        }
    };

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>{mode === 'create' ? 'Create' : 'Edit'} Display Ladder</Heading>
                <VStack spacing={6} alignItems='stretch'>
                    {mode === 'edit' && (
                        <SearchableSelect
                            label='Select display ladder'
                            aria-label='Select display ladder'
                            options={(data?.displayLadderMany ?? []).map((ladder) => ({
                                value: ladder._id,
                                label: ladder.name,
                            }))}
                            value={currentId}
                            onChange={setCurrentId}
                        />
                    )}
                    <FloatingLabelInput
                        id='ladder-name'
                        label='Name'
                        value={draft.name}
                        isInvalid={false}
                        isDisabled={disabled}
                        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    />
                    <HStack>
                        <SearchableSelect
                            label='Dimension'
                            aria-label='Dimension'
                            options={[
                                { value: 'mass', label: 'Mass' },
                                { value: 'volume', label: 'Volume' },
                            ]}
                            value={draft.dimension}
                            disabled={disabled}
                            onChange={(value) =>
                                setDraft((d) => ({
                                    ...d,
                                    dimension: value as EnumDisplayLadderDimension,
                                }))
                            }
                        />
                        <SearchableSelect
                            label='System'
                            aria-label='System'
                            options={[
                                { value: 'metric', label: 'Metric' },
                                { value: 'us', label: 'US customary' },
                            ]}
                            value={draft.system}
                            disabled={disabled}
                            onChange={(value) =>
                                setDraft((d) => ({
                                    ...d,
                                    system: value as EnumDisplayLadderSystem,
                                }))
                            }
                        />
                    </HStack>
                    <Text fontSize='sm' color='gray.500'>
                        A quantity is shown in the largest unit whose threshold it reaches.
                    </Text>
                    {draft.steps.map((step, index) => {
                        const unit = units.find((u) => u._id === step.unitId);
                        return (
                            <HStack key={index} aria-label={`Step ${index + 1}`}>
                                <SearchableSelect
                                    label='Unit'
                                    aria-label={`Step ${index + 1} unit`}
                                    options={units.map((u) => ({
                                        value: u._id,
                                        label: u.longSingular,
                                    }))}
                                    value={step.unitId}
                                    disabled={disabled}
                                    onChange={(value) => setStep(index, { unitId: value })}
                                />
                                <Text fontSize='sm'>from</Text>
                                <NumberInput
                                    size='sm'
                                    min={0}
                                    value={step.from}
                                    isDisabled={disabled}
                                    onChange={(value) => setStep(index, { from: value })}
                                    maxW='6em'
                                >
                                    <NumberInputField aria-label={`Step ${index + 1} threshold`} />
                                </NumberInput>
                                <Text fontSize='sm' minW='4em'>
                                    {unit?.shortPlural ?? ''}
                                </Text>
                                <IconButton
                                    size='xs'
                                    aria-label={`Remove step ${index + 1}`}
                                    icon={<CloseIcon />}
                                    isDisabled={disabled || draft.steps.length === 1}
                                    onClick={() =>
                                        setDraft((d) => ({
                                            ...d,
                                            steps: d.steps.filter((_, i) => i !== index),
                                        }))
                                    }
                                />
                            </HStack>
                        );
                    })}
                    <Button
                        size='sm'
                        variant='outline'
                        alignSelf='flex-start'
                        isDisabled={disabled}
                        onClick={() =>
                            setDraft((d) => ({
                                ...d,
                                steps: [...d.steps, { unitId: null, from: '1' }],
                            }))
                        }
                    >
                        Add step
                    </Button>
                    <ButtonGroup display='flex' justifyContent='flex-end' isDisabled={disabled}>
                        {current && (
                            <Button
                                colorScheme='red'
                                isLoading={deleting}
                                onClick={() => removeLadder({ variables: { id: current._id } })}
                                aria-label='Delete display ladder'
                            >
                                Delete
                            </Button>
                        )}
                        <Button
                            colorScheme='teal'
                            isLoading={creating || updating}
                            onClick={() => {
                                try {
                                    handleSave();
                                } catch (err) {
                                    onError(err as Error);
                                }
                            }}
                            aria-label='Save display ladder'
                        >
                            Save
                        </Button>
                    </ButtonGroup>
                </VStack>
            </Box>
        </VStack>
    );
}
