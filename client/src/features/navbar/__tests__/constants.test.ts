import { describe, expect, it } from 'vitest';

import { NavItem, PUBLIC_NAV_ITEMS, getNavItems } from '../constants';

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
        expect(getNavItems(false, false, items)).toBe(PUBLIC_NAV_ITEMS);
    });

    it('should keep every item for admins', () => {
        expect(getNavItems(true, true, items)).toEqual(items);
    });

    it('should drop admin-only items and groups left empty for non-admins', () => {
        expect(getNavItems(true, false, items)).toEqual([
            { label: 'Mixed', children: [{ label: 'Public child', href: '/public' }] },
            { label: 'Link', href: '/link' },
        ]);
    });
});
