import { PATH } from '@recipe/constants';

// The OS can kill an installed PWA in the background. It then relaunches at the manifest
// start_url, so the route the user was on is saved here and restored at boot.
const STORAGE_KEY = 'recipe:lastRoute';
export const LAST_ROUTE_MAX_AGE = 12 * 60 * 60 * 1000;

interface SavedRoute {
    path: string;
    savedAt: number;
}
interface RouteLocation {
    pathname: string;
    search: string;
    hash: string;
}

export function saveLastRoute(location: RouteLocation, now = Date.now()) {
    if (location.pathname === PATH.LOGIN) {
        return;
    }
    const saved: SavedRoute = {
        path: `${location.pathname}${location.search}${location.hash}`,
        savedAt: now,
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
        // Storage can be full or blocked; losing the route is not worth an error.
    }
}

function isRoot(pathname: string) {
    return pathname.replace(/\/+$/, '') === PATH.ROOT.replace(/\/+$/, '');
}

// Returns the saved route if the app has launched at the home page and the saved route is
// recent, otherwise null.
export function getRestorableRoute(location: RouteLocation, now = Date.now()): string | null {
    if (!isRoot(location.pathname) || location.search || location.hash) {
        return null;
    }
    let saved: SavedRoute;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }
        saved = JSON.parse(raw) as SavedRoute;
    } catch {
        return null;
    }
    if (typeof saved?.path !== 'string' || typeof saved.savedAt !== 'number') {
        return null;
    }
    if (now - saved.savedAt > LAST_ROUTE_MAX_AGE) {
        return null;
    }
    if (isRoot(saved.path.split(/[?#]/)[0])) {
        return null;
    }
    if (PATH.BASE && !saved.path.startsWith(`${PATH.BASE}/`)) {
        return null;
    }
    return saved.path;
}
