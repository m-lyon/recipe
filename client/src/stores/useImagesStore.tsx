import { create } from 'zustand';

export interface ImagesState {
    images: File[];
    resetImages: () => void;
    addImage: (image: File) => void;
    setImages: (images: File[]) => void;
    removeImage: (index: number) => void;
}
export const useImagesStore = create<ImagesState>()((set) => ({
    images: [],
    resetImages: () => set(() => ({ images: [] })),
    addImage: (image: File) => set((state) => ({ images: [...state.images, image] })),
    setImages: (images: File[]) => set(() => ({ images })),
    removeImage: (index: number) =>
        set((state) => ({
            images: state.images.filter((_, i) => i !== index),
        })),
}));
