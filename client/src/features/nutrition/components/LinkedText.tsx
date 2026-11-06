import { HStack, Link, Skeleton, Text } from '@chakra-ui/react';

import { NutritionSelection } from './nutritionTypes';
import { openFoodFactsUrl } from '../utils/nutrition';

export function LinkedText(props: {
    linked: NutritionSelection;
    label?: string;
    usdaName: string | null;
    loading: boolean;
}) {
    const { linked, label = 'Linked', usdaName, loading } = props;
    if (linked.source === 'manual') {
        return (
            <Text fontSize='sm'>
                {['Entered manually', linked.sourceName].filter(Boolean).join(' · ')}
            </Text>
        );
    }
    if (linked.source === 'openFoodFacts') {
        const barcode = linked.openFoodFactsBarcode ?? '';
        // The product page link gives the ODbL attribution.
        return (
            <Text fontSize='sm'>
                {label}: {linked.sourceName ?? barcode} ·{' '}
                <Link href={openFoodFactsUrl(barcode)} isExternal textDecoration='underline'>
                    Open Food Facts {barcode}
                </Link>
            </Text>
        );
    }
    const name = usdaName ?? linked.sourceName;
    if (!name && loading) {
        return (
            <HStack fontSize='sm' spacing={1}>
                <Text>{label}:</Text>
                <Skeleton height='10px' width='12em' aria-label='Loading linked item name' />
            </HStack>
        );
    }
    return (
        <Text fontSize='sm'>
            {label}: {name ? name.toLowerCase() : `FDC ID ${linked.usdaFdcId}`}
        </Text>
    );
}
