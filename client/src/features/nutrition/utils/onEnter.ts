export function onEnter(action: () => void) {
    return (e: React.KeyboardEvent) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        e.stopPropagation();
        action();
    };
}
