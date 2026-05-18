import { ReservedTags } from '@recipe/graphql/enums';

export function displayCalculatedTag(tag: string) {
    if (tag === ReservedTags.VeganVersionAvailable) {
        return 'vegan version available';
    }
    return tag;
}
