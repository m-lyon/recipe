import { ReservedTags } from '@recipe/graphql/enums';

export function formatCalculatedTag(tag: string) {
    if (tag === ReservedTags.VeganVersionAvailable) {
        return 'vegan version available';
    }
    return tag;
}
