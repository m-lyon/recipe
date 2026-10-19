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
    apply: ApplyUnitConversion;
    convert: ConvertToSystem;
    ladders: DisplayLadder[];
    loading: boolean;
    failed: boolean;
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

    return { apply, convert, ladders, loading, failed: error != null };
}
