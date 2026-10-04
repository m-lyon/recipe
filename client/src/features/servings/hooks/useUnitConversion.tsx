import { useQuery } from '@apollo/client';

import { applyLadder, convertToSystem } from '@recipe/utils/units';
import { GET_DISPLAY_LADDERS } from '@recipe/graphql/queries/displayLadder';
import { DisplayLadder, SystemConversion, UnitSystemPreference } from '@recipe/utils/units';

export interface UnitConversionArgs {
    quantity: FinishedQuantity;
    unit: FinishedUnit;
}
export type ApplyUnitConversion = ({ quantity, unit }: UnitConversionArgs) => UnitConversionArgs;
export type ConvertToSystem = (
    args: UnitConversionArgs,
    preference: UnitSystemPreference
) => UnitConversionArgs & Pick<SystemConversion, 'approximate'>;
interface UseUnitConversionReturnType {
    /** Ladders a quantity within its authored unit's system: 1500 g becomes 1.5 kg. */
    apply: ApplyUnitConversion;
    /** Shows a quantity in the reader's chosen system, rounded and marked approximate. */
    convert: ConvertToSystem;
    ladders: DisplayLadder[];
    loading: boolean;
}
export function useUnitConversion(): UseUnitConversionReturnType {
    const { data, loading, error } = useQuery(GET_DISPLAY_LADDERS);
    const ladders = data?.displayLadderMany ?? [];
    const ready = !loading && !error && data != null;

    const apply = ({ quantity, unit }: UnitConversionArgs): UnitConversionArgs => {
        if (unit == null || quantity == null || !ready) {
            return { quantity, unit };
        }
        return applyLadder(quantity, unit, ladders);
    };

    const convert: ConvertToSystem = ({ quantity, unit }, preference) => {
        if (unit == null || quantity == null || !ready) {
            return { quantity, unit, approximate: false };
        }
        return convertToSystem(quantity, unit, preference, ladders);
    };

    return { apply, convert, ladders, loading };
}
