import { PATH } from '@recipe/constants';

export interface NavItem {
    label: string;
    ariaLabel?: string;
    subLabel?: string;
    children?: Array<NavItem>;
    href?: string;
    parentOnToggle?: () => void;
    /** Only shown to admins, e.g. when the API restricts the page's actions to admins */
    adminOnly?: boolean;
}
export const USER_NAV_ITEMS: Array<NavItem> = [
    {
        label: 'Create',
        href: `${PATH.ROOT}/create/recipe`,
        children: [
            {
                label: 'Recipe',
                ariaLabel: 'Create new recipe',
                href: `${PATH.ROOT}/create/recipe`,
            },
            {
                label: 'Unit',
                ariaLabel: 'Create new unit',
                href: `${PATH.ROOT}/create/unit`,
            },
            {
                label: 'Size',
                ariaLabel: 'Create new size',
                href: `${PATH.ROOT}/create/size`,
            },
            {
                label: 'Ingredient',
                ariaLabel: 'Create new ingredient',
                href: `${PATH.ROOT}/create/ingredient`,
            },
            {
                label: 'Prep Method',
                ariaLabel: 'Create new prep method',
                href: `${PATH.ROOT}/create/prep-method`,
            },
            {
                label: 'Unit Conversion',
                ariaLabel: 'Create new unit conversion rule',
                adminOnly: true,
                href: `${PATH.ROOT}/create/unit-conversion`,
            },
        ],
    },
    {
        label: 'Edit',
        children: [
            {
                label: 'Unit',
                ariaLabel: 'Edit existing unit',
                href: `${PATH.ROOT}/edit/unit`,
            },
            {
                label: 'Size',
                ariaLabel: 'Edit existing size',
                href: `${PATH.ROOT}/edit/size`,
            },
            {
                label: 'Ingredient',
                ariaLabel: 'Edit existing ingredient',
                href: `${PATH.ROOT}/edit/ingredient`,
            },
            {
                label: 'Prep Method',
                ariaLabel: 'Edit existing prep method',
                href: `${PATH.ROOT}/edit/prep-method`,
            },
            {
                label: 'Unit Conversion',
                ariaLabel: 'Edit existing unit conversion',
                adminOnly: true,
                href: `${PATH.ROOT}/edit/unit-conversion`,
            },
        ],
    },
];

export const PUBLIC_NAV_ITEMS: Array<NavItem> = [];

/** Nav items to show the current user, without admin-only entries for non-admins. */
export function getNavItems(isVerified: boolean, isAdmin: boolean): Array<NavItem> {
    if (!isVerified) return PUBLIC_NAV_ITEMS;
    const filterItems = (items: Array<NavItem>): Array<NavItem> =>
        items
            .filter((item) => isAdmin || !item.adminOnly)
            .map((item) =>
                item.children ? { ...item, children: filterItems(item.children) } : item
            );
    return filterItems(USER_NAV_ITEMS);
}

export const NAV_HEIGHT = 60;
export const SEARCH_FILTER_MOBILE_HEIGHT = 150;
export const SELECTED_FILTERS_HEIGHT = 32;
