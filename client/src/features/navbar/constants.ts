import { PATH } from '@recipe/constants';

export interface NavItem {
    label: string;
    ariaLabel?: string;
    subLabel?: string;
    children?: Array<NavItem>;
    href?: string;
    parentOnToggle?: () => void;
    adminOnly?: boolean;
}
export const USER_NAV_ITEMS: Array<NavItem> = [
    {
        label: 'Create',
        href: `${PATH.BASE}/create/recipe`,
        children: [
            {
                label: 'Recipe',
                ariaLabel: 'Create new recipe',
                href: `${PATH.BASE}/create/recipe`,
            },
            {
                label: 'Unit',
                ariaLabel: 'Create new unit',
                href: `${PATH.BASE}/create/unit`,
            },
            {
                label: 'Size',
                ariaLabel: 'Create new size',
                href: `${PATH.BASE}/create/size`,
            },
            {
                label: 'Ingredient',
                ariaLabel: 'Create new ingredient',
                href: `${PATH.BASE}/create/ingredient`,
            },
            {
                label: 'Prep Method',
                ariaLabel: 'Create new prep method',
                href: `${PATH.BASE}/create/prep-method`,
            },
            {
                label: 'Unit Conversion',
                ariaLabel: 'Create new unit conversion rule',
                adminOnly: true,
                href: `${PATH.BASE}/create/unit-conversion`,
            },
        ],
    },
    {
        label: 'Edit',
        children: [
            {
                label: 'Unit',
                ariaLabel: 'Edit existing unit',
                href: `${PATH.BASE}/edit/unit`,
            },
            {
                label: 'Size',
                ariaLabel: 'Edit existing size',
                href: `${PATH.BASE}/edit/size`,
            },
            {
                label: 'Ingredient',
                ariaLabel: 'Edit existing ingredient',
                href: `${PATH.BASE}/edit/ingredient`,
            },
            {
                label: 'Prep Method',
                ariaLabel: 'Edit existing prep method',
                href: `${PATH.BASE}/edit/prep-method`,
            },
            {
                label: 'Unit Conversion',
                ariaLabel: 'Edit existing unit conversion',
                adminOnly: true,
                href: `${PATH.BASE}/edit/unit-conversion`,
            },
        ],
    },
];

export const PUBLIC_NAV_ITEMS: Array<NavItem> = [];

/** Remove admin-only entries for non-admins, and any groups left with nothing to open. */
export function filterNavItems(items: Array<NavItem>, isAdmin: boolean): Array<NavItem> {
    return items
        .filter((item) => isAdmin || !item.adminOnly)
        .map((item) =>
            item.children ? { ...item, children: filterNavItems(item.children, isAdmin) } : item
        )
        .filter((item) => item.href || !item.children || item.children.length > 0);
}

/** Nav items to show the current user, without admin-only entries for non-admins. */
export function getNavItems(isVerified: boolean, isAdmin: boolean): Array<NavItem> {
    if (!isVerified) return PUBLIC_NAV_ITEMS;
    return filterNavItems(USER_NAV_ITEMS, isAdmin);
}

export const NAV_HEIGHT = 60;
export const SEARCH_FILTER_MOBILE_HEIGHT = 150;
export const SELECTED_FILTERS_HEIGHT = 32;
