import { WarningTwoIcon } from '@chakra-ui/icons';
import { Skeleton, Stack, Text, Tooltip } from '@chakra-ui/react';
import { Badge, Box, HStack, Radio, RadioGroup } from '@chakra-ui/react';

export interface NutritionResult {
    key: string;
    badge: string;
    title: string;
    /** Brand, pack quantity and the like, one line each. Empty lines are left out. */
    details: (string | null | undefined)[];
    per100g: string;
    warnings?: string[];
}

interface Props {
    label: string;
    results: NutritionResult[];
    selectedKey: string | null;
    onSelect: (key: string) => void;
    /** USDA names are in title case; shown in lower case to match the app. */
    lowercase?: boolean;
}

export function NutritionSearchSkeleton() {
    return (
        <Stack spacing={3}>
            <Skeleton height='10px' width='40%' />
            <Skeleton height='10px' />
            <Skeleton height='10px' />
            <Skeleton height='10px' width='40%' />
            <Skeleton height='10px' />
            <Skeleton height='10px' />
        </Stack>
    );
}

export function NutritionResultList(props: Props) {
    const { label, results, selectedKey, onSelect, lowercase } = props;
    const textTransform = lowercase ? 'lowercase' : undefined;
    return (
        <Box
            maxH='200px'
            overflowY='auto'
            overflowX='hidden'
            w='100%'
            border='1px solid'
            borderColor='gray.200'
            borderRadius='md'
            p={2}
        >
            <RadioGroup value={selectedKey ?? ''} onChange={onSelect} aria-label={label}>
                <Stack spacing={1}>
                    {results.map((item) => (
                        <Box
                            key={item.key}
                            onClick={() => onSelect(item.key)}
                            cursor='pointer'
                            borderRadius='sm'
                            px={2}
                            py={1}
                            bg={selectedKey === item.key ? 'gray.100' : 'transparent'}
                            _hover={{ bg: 'gray.50' }}
                        >
                            <HStack spacing={2} align='flex-start' minW={0}>
                                <Radio value={item.key} mt={1} />
                                <Stack spacing={0.5} flex={1} minW={0}>
                                    <HStack spacing={2} align='flex-start'>
                                        <Badge flexShrink={0} mt={0.5} fontSize='0.65em'>
                                            {item.badge}
                                        </Badge>
                                        <Text
                                            fontSize='sm'
                                            wordBreak='break-word'
                                            textTransform={textTransform}
                                            flex={1}
                                        >
                                            {item.title}
                                        </Text>
                                        {item.warnings && item.warnings.length > 0 && (
                                            <Tooltip label={item.warnings.join('. ')} hasArrow>
                                                <WarningTwoIcon
                                                    color='orange.400'
                                                    mt={1}
                                                    aria-label={`Warning: ${item.warnings.join('. ')}`}
                                                    role='img'
                                                />
                                            </Tooltip>
                                        )}
                                    </HStack>
                                    {item.details
                                        .filter((line): line is string => Boolean(line))
                                        .map((line) => (
                                            <Text
                                                key={line}
                                                fontSize='sm'
                                                color='gray.500'
                                                wordBreak='break-word'
                                                textTransform={textTransform}
                                            >
                                                {line}
                                            </Text>
                                        ))}
                                    <Text fontSize='sm' color='gray.500' wordBreak='break-word'>
                                        {item.per100g}
                                    </Text>
                                </Stack>
                            </HStack>
                        </Box>
                    ))}
                </Stack>
            </RadioGroup>
        </Box>
    );
}
