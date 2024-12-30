import { PATH } from '@recipe/constants';

export interface NavItem {
    label: string;
    ariaLabel?: string;
    subLabel?: string;
    children?: Array<NavItem>;
    href?: string;
    parentOnToggle?: () => void;
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
        ],
    },
];

export const PUBLIC_NAV_ITEMS: Array<NavItem> = [];
