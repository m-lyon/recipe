import { describe, expect, it } from 'vitest';

import { NavItem, PUBLIC_NAV_ITEMS, filterNavItems, getNavItems } from '../constants';

const items: Array<NavItem> = [
    {
        label: 'Mixed',
        children: [
            { label: 'Public child', href: '/public' },
            { label: 'Admin child', href: '/admin', adminOnly: true },
        ],
    },
    {
        label: 'Admin group',
        children: [{ label: 'Only admin child', href: '/admin-only', adminOnly: true }],
    },
    { label: 'Link', href: '/link' },
];

describe('getNavItems', () => {
    it('should return public items for unverified users', () => {
        expect(getNavItems(false, false)).toBe(PUBLIC_NAV_ITEMS);
    });

    it('should link Edit to the recipe and list it first when given an edit recipe link', () => {
        const edit = getNavItems(true, false, '/edit/recipe/mock').find((i) => i.label === 'Edit');
        expect(edit?.href).toBe('/edit/recipe/mock');
        expect(edit?.children?.[0]).toEqual({
            label: 'Recipe',
            ariaLabel: 'Edit this recipe',
            href: '/edit/recipe/mock',
        });
    });

    it('should leave Edit without a link when not given an edit recipe link', () => {
        const edit = getNavItems(true, false).find((i) => i.label === 'Edit');
        expect(edit?.href).toBeUndefined();
        expect(edit?.children?.map((c) => c.label)).not.toContain('Recipe');
    });
});

describe('filterNavItems', () => {
    it('should keep every item for admins', () => {
        expect(filterNavItems(items, true)).toEqual(items);
    });

    it('should drop admin-only items and groups left empty for non-admins', () => {
        expect(filterNavItems(items, false)).toEqual([
            { label: 'Mixed', children: [{ label: 'Public child', href: '/public' }] },
            { label: 'Link', href: '/link' },
        ]);
    });
});
