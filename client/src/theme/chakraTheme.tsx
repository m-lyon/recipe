import { extendTheme } from '@chakra-ui/react';

const activeLabelStyles = {
    transform: 'scale(0.85) translateY(-24px)',
};
export const imageCardWidth = 360;
export const imageRatio = 3 / 2;
const sliderBarHeight = 36
const imageCardHeight = (imageCardWidth / imageRatio) + sliderBarHeight;
export const tagsHeight = 34
const gridSpacing = 24
export const remainderImageCardHeight = imageCardHeight - tagsHeight - gridSpacing;

export const theme = extendTheme({
    components: {
        Form: {
            variants: {
                floating: {
                    container: {
                        _focusWithin: {
                            label: {
                                ...activeLabelStyles,
                            },
                        },
                        'input:not(:placeholder-shown) + label, .chakra-select__wrapper + label, textarea:not(:placeholder-shown) ~ label':
                            {
                                ...activeLabelStyles,
                            },
                        label: {
                            top: 0,
                            left: 0,
                            zIndex: 2,
                            position: 'absolute',
                            backgroundColor: 'white',
                            pointerEvents: 'none',
                            mx: 3,
                            px: 1,
                            my: 2,
                            transformOrigin: 'left top',
                        },
                    },
                },
            },
        },
        Card: {
            variants: {
                image: {
                    container: {
                        h: imageCardHeight,
                        w: imageCardWidth,
                        position: 'absolute',
                        zIndex: 1,
                        right: 0,
                        top: 0,
                    },
                },
            },
        },
    },
});
