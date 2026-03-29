import { fraction } from 'mathjs';
import { Text } from '@mantine/core';

import { formatFraction, isRange } from '@recipe/utils/number';
import { scaleQuantity } from '@recipe/utils/quantity';

interface Props {
    origQuantity: string;
    unit: UnitView;
    currentServings: number;
    origServings: number;
}
export function Yield(props: Props) {
    const { origQuantity, unit, currentServings, origServings } = props;
    const scaledQty = scaleQuantity(origQuantity, currentServings, origServings, unit);
    const displayQty = isRange(scaledQty)
        ? scaledQty
              .split('-')
              .map((part) => formatFraction(part))
              .join('-')
        : formatFraction(scaledQty);

    const displayUnit = (() => {
        if (!unit) return '';
        let numeric: number;
        if (isRange(scaledQty)) {
            numeric = 2; // ranges are always plural
        } else {
            const fract = fraction(scaledQty);
            numeric = fract.n / fract.d;
        }
        const name = numeric === 1 ? unit.shortSingular : unit.shortPlural;
        return unit.hasSpace ? ` ${name}` : name;
    })();

    return (
        <Text size='sm' c='dimmed' aria-label='Recipe yield'>
            {`Yield: ${displayQty}${displayUnit}`}
        </Text>
    );
}
