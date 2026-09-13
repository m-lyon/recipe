import { GraphQLError } from 'graphql';
import { ResolverNextRpCb } from 'graphql-compose';

import { GraphQLContext } from '../types.js';

/**
 * Per-user sliding-window rate limit.
 *
 * The USDA proxy resolvers spend a single server-wide API key with a 1000 requests/hour
 * quota, so one account looping searches would exhaust it for everybody. The window is
 * held in process memory: the API runs as a single node, and losing the counters on a
 * restart only forgives usage, it never over-restricts.
 */
const buckets = new Map<string, number[]>();

/** Requests handled since the last sweep of fully expired keys. */
let sinceSweep = 0;
const SWEEP_INTERVAL = 100;

export const rateLimit =
    (name: string, limit: number, windowMs: number): ResolverNextRpCb<unknown, GraphQLContext> =>
    (next) =>
    (rp) => {
        const user = rp.context.getUser();
        if (!user) {
            throw new GraphQLError('You are not authenticated!', {
                extensions: { code: 'UNAUTHENTICATED' },
            });
        }
        const key = `${name}:${user._id.toString()}`;
        const now = Date.now();
        const hits = (buckets.get(key) ?? []).filter((time) => now - time < windowMs);
        if (hits.length >= limit) {
            const retryAfterMs = windowMs - (now - hits[0]);
            throw new GraphQLError(
                `Rate limit exceeded for ${name}. Try again in ` +
                    `${Math.ceil(retryAfterMs / 1000)} seconds.`,
                { extensions: { code: 'RATE_LIMITED', retryAfterMs } }
            );
        }
        hits.push(now);
        buckets.set(key, hits);
        // Periodically drop keys whose window has fully expired, so the map does not
        // grow monotonically with every user that has ever hit a limited resolver.
        if (++sinceSweep >= SWEEP_INTERVAL) {
            sinceSweep = 0;
            for (const [otherKey, times] of buckets) {
                if (otherKey !== key && now - times[times.length - 1] >= windowMs) {
                    buckets.delete(otherKey);
                }
            }
        }
        return next(rp);
    };

/** Test hook: drops every recorded window so cases do not leak into each other. */
export function resetRateLimits(): void {
    buckets.clear();
    sinceSweep = 0;
}
