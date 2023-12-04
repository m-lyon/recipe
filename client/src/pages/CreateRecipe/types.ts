export interface Suggestion {
    value: string;
    colour?: string;
    _id: undefined;
}

export interface NewFormProps {
    firstFieldRef: React.MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    handleSelect: (item: Suggestion) => void;
}
