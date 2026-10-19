import { afterEach, describe, expect, it } from 'vitest';

import { PATH } from '@recipe/constants';
import { LAST_ROUTE_MAX_AGE, getRestorableRoute, saveLastRoute } from '@recipe/utils/lastRoute';

const RECIPE_PATH = `${PATH.BASE}/view/recipe/mock_recipe`;
const location = (pathname: string, search = '', hash = '') => ({ pathname, search, hash });

describe('lastRoute', () => {
    afterEach(() => {
        localStorage.clear();
    });

    it('restores the saved route when the app launches at the home page', () => {
        saveLastRoute(location(RECIPE_PATH, '?a=1'), 1000);
        expect(getRestorableRoute(location(PATH.ROOT), 2000)).toBe(`${RECIPE_PATH}?a=1`);
    });

    it('does not restore when the app launches at another route', () => {
        saveLastRoute(location(RECIPE_PATH), 1000);
        expect(getRestorableRoute(location(`${PATH.BASE}/search`), 2000)).toBeNull();
    });

    it('does not restore a route older than the maximum age', () => {
        saveLastRoute(location(RECIPE_PATH), 1000);
        expect(getRestorableRoute(location(PATH.ROOT), 1001 + LAST_ROUTE_MAX_AGE)).toBeNull();
    });

    it('does not restore when the last route was the home page', () => {
        saveLastRoute(location(RECIPE_PATH), 1000);
        saveLastRoute(location(PATH.ROOT), 1500);
        expect(getRestorableRoute(location(PATH.ROOT), 2000)).toBeNull();
    });

    it('does not save the login page', () => {
        saveLastRoute(location(RECIPE_PATH), 1000);
        saveLastRoute(location(PATH.LOGIN), 1500);
        expect(getRestorableRoute(location(PATH.ROOT), 2000)).toBe(RECIPE_PATH);
    });

    it('ignores invalid stored data', () => {
        localStorage.setItem('recipe:lastRoute', 'not json');
        expect(getRestorableRoute(location(PATH.ROOT), 2000)).toBeNull();
    });
});
