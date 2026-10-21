import { Text } from '@mantine/core';

import { isPlural } from '@recipe/utils/plural';
import { scaleQuantity } from '@recipe/utils/quantity';
import { getFinishedQuantityStr, unitDisplayValue } from '@recipe/utils/formatting';

interface Props {
    rows: NonNullable<CompletedRecipeView['yield']>;
    /** The recipe's title, for a count of whole batches: "2 pizza doughs". */
    title: string;
    pluralTitle?: string | null;
    currentServings: number;
    origServings: number;
}

/** "2 pizza doughs", "900 g": one row, scaled to the servings shown. */
function describeRow(
    row: Props['rows'][number],
    props: Pick<Props, 'title' | 'pluralTitle' | 'currentServings' | 'origServings'>
): string {
    const unit = row.unit;
    const quantity = scaleQuantity(row.quantity, props.currentServings, props.origServings, unit);
    const shown = getFinishedQuantityStr(quantity);
    if (!unit || unit.hidden) {
        const name = isPlural(quantity) ? (props.pluralTitle ?? props.title) : props.title;
        return `${shown} ${name.toLowerCase()}`;
    }
    return `${shown}${unit.hasSpace ? ' ' : ''}${unitDisplayValue(quantity, unit, true)}`;
}

/**
 * How much the recipe makes: "Makes 2 pizza doughs (≈ 900 g)". The first row leads; the
 * others are the same batch measured another way.
 */
export function Yield(props: Props) {
    const { rows } = props;
    if (rows.length === 0) return null;
    const [first, ...others] = rows.map((row) => describeRow(row, props));
    const rest = others.length > 0 ? ` (≈ ${others.join(', ')})` : '';
    return (
        <Text size='sm' c='dimmed' aria-label='Recipe yield'>
            {`Makes ${first}${rest}`}
        </Text>
    );
}
