import { fraction } from 'mathjs';
import { Text } from '@mantine/core';

import { scaleQuantity } from '@recipe/utils/quantity';
import { formatFraction, isRange } from '@recipe/utils/number';

interface Props {
    origQuantity: string;
    unit: UnitView;
    currentServings: number;
    origServings: number;
}
export function Yield(props: Props) {
    const { origQuantity, unit, currentServings, origServings } = props;
    const scaledQty = scaleQuantity(origQuantity, currentServings, origServings, unit);

    let displayQty: string;
    try {
        displayQty = isRange(scaledQty)
            ? scaledQty
                .split('-')
                .map((part) => formatFraction(part))
                .join('-')
            : formatFraction(scaledQty);
    } catch {
        displayQty = scaledQty;
    }

    const displayUnit = (() => {
        if (!unit) return '';
        let numeric: number;
        if (isRange(scaledQty)) {
            numeric = 2; // ranges are always plural
        } else {
            try {
                const fract = fraction(scaledQty);
                numeric = (fract.s * fract.n) / fract.d;
            } catch {
                numeric = 2; // default to plural on parse failure
            }
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
