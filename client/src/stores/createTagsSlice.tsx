import { StateCreator } from 'zustand';

interface FinishedTag {
    _id: string;
    value: string;
    key: string;
    isNew: boolean;
}
export interface TagsSlice {
    editableTag: string;
    finishedTags: FinishedTag[];
    tagsDropdownIsOpen: boolean;
    resetTags: () => void;
    resetEditableTag: () => void;
    showTagsDropdown: () => void;
    hideTagsDropdown: () => void;
    setAndSubmitTag: (value: string, _id: string, isNew?: boolean) => void;
    setTag: (value: string, _id?: string) => void;
    setTags: (tags: FinishedTag[]) => void;
    removeTag: (index: number) => void;
}
export const createTagsSlice: StateCreator<TagsSlice> = (set) => ({
    editableTag: '',
    finishedTags: [],
    tagsDropdownIsOpen: false,
    resetTags: () => set({ finishedTags: [], editableTag: '', tagsDropdownIsOpen: false }),
    resetEditableTag: () => set({ editableTag: '', tagsDropdownIsOpen: false }),
    showTagsDropdown: () => set({ tagsDropdownIsOpen: true }),
    hideTagsDropdown: () => set({ tagsDropdownIsOpen: false }),
    setTag: (value: string) => set({ editableTag: value.toLowerCase() }),
    setTags: (tags: FinishedTag[]) => set({ finishedTags: tags }),
    setAndSubmitTag: (value: string, _id: string, isNew?: boolean) =>
        set((state) => {
            const newTag: FinishedTag = { _id, value, key: value.toLowerCase(), isNew: !!isNew };
            return {
                finishedTags: [...state.finishedTags, newTag],
                editableTag: '',
                tagsDropdownIsOpen: false,
            };
        }),
    removeTag: (index: number) =>
        set((state) => {
            const newTags = [...state.finishedTags];
            newTags.splice(index, 1);
            return { finishedTags: newTags };
        }),
});
