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
