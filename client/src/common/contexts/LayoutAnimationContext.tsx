import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

type LayoutProp = 'position' | 'size' | boolean;

// Defaults to `true` so any consumer used outside a provider keeps animating as
// before. Within the provider it starts `false` and flips to `true` once the
// initial layout has settled.
const LayoutAnimationContext = createContext<boolean>(true);

export function LayoutAnimationProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        // Wait two animation frames before enabling framer-motion `layout`
        // animations. The initial render of an editing page settles over a
        // couple of frames (responsive breakpoint resolution, async data
        // hydration, web-font swap, autosizing textareas). Enabling `layout`
        // straight away makes framer animate that first post-paint reflow, so
        // rows visibly slide into their final position on load. By the time the
        // second frame fires the layout has settled, so enabling animations
        // then compares a settled box against itself (no movement) while still
        // animating every subsequent edit.
        let raf2 = 0;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => setReady(true));
        });
        return () => {
            cancelAnimationFrame(raf1);
            cancelAnimationFrame(raf2);
        };
    }, []);
    return (
        <LayoutAnimationContext.Provider value={ready}>{children}</LayoutAnimationContext.Provider>
    );
}

// Returns the value to pass to a motion component's `layout` prop: the desired
// active value once layout animations are enabled, or `false` while the page is
// still settling.
export function useLayoutAnimation(active: LayoutProp = 'position'): LayoutProp {
    const ready = useContext(LayoutAnimationContext);
    return ready ? active : false;
}
