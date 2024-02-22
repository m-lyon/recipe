import { useSize } from '@chakra-ui/react-use-size'
import { useState, useCallback, useEffect, useMemo } from 'react';
import { ReactNode, useRef, useLayoutEffect, Dispatch, SetStateAction } from 'react';
import { Box, Flex, Button, Progress, VStack } from '@chakra-ui/react';
import { ChevronRightIcon, ChevronLeftIcon } from '@chakra-ui/icons';
import { percentage } from '../../../utils/number';
import { PanInfo, motion, useAnimation, useMotionValue } from 'framer-motion';

interface Props {
    children: ReactNode[];
    gap: number;
}
export function Carousel({ children, gap }: Props){
    const [trackIsActive, setTrackIsActive] = useState(false);
    const [activeItem, setActiveItem] = useState(0);
    const [sliderWidth, setSliderWidth] = useState(0);
    const [itemWidth, setItemWidth] = useState(0);

    // const initSliderWidth = (width: number) => setSliderWidth(width);
    const initSliderWidth = useCallback((width: number) => setSliderWidth(width), []);

    useEffect(() => {
        setItemWidth(sliderWidth - gap);
    }, [sliderWidth, gap]);

    const positions = useMemo(
        () => children.map((_, index) => -Math.abs((itemWidth + gap) * index)),
        [children, itemWidth, gap]
    );

    const sliderProps: Omit<SliderProps, 'children'> = {
        setTrackIsActive,
        initSliderWidth,
        setActiveItem,
        itemWidth,
        activeItem,
        positions,
        gap
    };

    const trackProps: Omit<TrackProps, 'children'> = {
        setTrackIsActive,
        trackIsActive,
        setActiveItem,
        itemWidth,
        activeItem,
        positions
    };

    const itemProps: Omit<ItemProps, 'children' | 'index'> = {
        setTrackIsActive,
        setActiveItem,
        activeItem,
        itemWidth,
        positions,
        gap
    };

    return (
        <Slider {...sliderProps}>
            <Track {...trackProps}>
                {children.map((child, index) => (
                    <Item {...itemProps} index={index} key={index}>
                        {child}
                    </Item>
                ))}
            </Track>
        </Slider>
    );
}

interface SliderProps {
    children: ReactNode;
    gap: number;
    positions: number[];
    activeItem: number;
    itemWidth: number;
    setActiveItem: Dispatch<SetStateAction<number>>;
    setTrackIsActive: Dispatch<SetStateAction<boolean>>;
    initSliderWidth: (width: number) => void;
}
function Slider(props: SliderProps) {
    const { children, gap, positions, activeItem, itemWidth, setActiveItem, setTrackIsActive, initSliderWidth } = props;
    const ref = useRef<HTMLDivElement>(null);
    const dims = useSize(ref);
    console.log('width is', dims?.width, 'itemWidth is', itemWidth)

    useLayoutEffect(() => {
        if (dims) {
            initSliderWidth(Math.round(dims.width));
        }
    }, [dims?.width, initSliderWidth]);

    const handleFocus = () => setTrackIsActive(true);
    const handleDecrementClick = () => {
        setTrackIsActive(true);
        !(activeItem === positions.length - positions.length) && setActiveItem((prev) => prev - 1);
    };
    const handleIncrementClick = () => {
        setTrackIsActive(true);
        !(activeItem === positions.length - 1) && setActiveItem((prev) => prev + 1);
    };

    return (
        <>
            <Box
                ref={ref}
                w={{ base: '100%', md: `calc(100% + ${gap}px)` }}
                ml={{ base: 0, md: `-${gap / 2}px` }}
                px={`${gap / 2}px`}
                position='relative'
                overflow='hidden'
                _before={{
                    bgGradient: 'linear(to-r, base.d400, transparent)',
                    position: 'absolute',
                    w: `${gap / 2}px`,
                    content: "''",
                    zIndex: 1,
                    h: '100%',
                    left: 0,
                    top: 0,
                }}
                _after={{
                    bgGradient: 'linear(to-l, base.d400, transparent)',
                    position: 'absolute',
                    w: `${gap / 2}px`,
                    content: "''",
                    zIndex: 1,
                    h: '100%',
                    right: 0,
                    top: 0,
                }}
            >
                {children}
            </Box>

            <Flex w={`${itemWidth}px`} mt={`${0}px`} mx='auto'>
                <Button
                    onClick={handleDecrementClick}
                    onFocus={handleFocus}
                    mr={`${gap / 3}px`}
                    color='gray.200'
                    variant='link'
                    minW={0}
                >
                    <ChevronLeftIcon boxSize={9} />
                </Button>

                <Progress
                    value={percentage(activeItem, positions.length - 1)}
                    alignSelf='center'
                    borderRadius='2px'
                    bg='base.d100'
                    flex={1}
                    h='3px'
                    sx={{
                        '> div': {
                            backgroundColor: 'gray.400',
                        },
                    }}
                />

                <Button
                    onClick={handleIncrementClick}
                    onFocus={handleFocus}
                    ml={`${gap / 3}px`}
                    color='gray.200'
                    variant='link'
                    zIndex={2}
                    minW={0}
                >
                    <ChevronRightIcon boxSize={9} />
                </Button>
            </Flex>
        </>
    );
};

const MotionFlex = motion(Flex);
const transitionProps = {
    stiffness: 400,
    type: 'spring',
    damping: 60,
    mass: 3,
};

interface TrackProps {
    children: ReactNode;
    positions: number[];
    activeItem: number;
    itemWidth: number;
    setTrackIsActive: Dispatch<SetStateAction<boolean>>;
    trackIsActive: boolean;
    setActiveItem: Dispatch<SetStateAction<number>>;
}
function Track(props: TrackProps) {
    const {
        children,
        positions,
        activeItem,
        itemWidth,
        setTrackIsActive,
        trackIsActive,
        setActiveItem
    } = props;
    const multiplier = 0.65;
    const [dragStartPosition, setDragStartPosition] = useState(0);
    const controls = useAnimation();
    const x = useMotionValue(0);
    const node = useRef<HTMLDivElement>(null);

    const handleDragStart = (_: MouseEvent | PointerEvent | TouchEvent) => {
        setDragStartPosition(positions[activeItem]);
    };

    const handleDragEnd = (_: MouseEvent | PointerEvent | TouchEvent, info: PanInfo) => {
        console.log(info);
        const distance = info.offset.x;
        const velocity = info.velocity.x * multiplier;
        const direction = velocity < 0 || distance < 0 ? 1 : -1;

        const extrapolatedPosition =
            dragStartPosition +
            (direction === 1 ? Math.min(velocity, distance) : Math.max(velocity, distance));

        const closestPosition = positions.reduce((prev, curr) => {
            return Math.abs(curr - extrapolatedPosition) < Math.abs(prev - extrapolatedPosition)
                ? curr
                : prev;
        }, 0);

        if (!(closestPosition < positions[positions.length - 1])) {
            setActiveItem(positions.indexOf(closestPosition));
            controls.start({
                x: closestPosition,
                transition: {
                    velocity: info.velocity.x,
                    ...transitionProps,
                },
            });
        } else {
            setActiveItem(positions.length - 1);
            controls.start({
                x: positions[positions.length - 1],
                transition: {
                    velocity: info.velocity.x,
                    ...transitionProps,
                },
            });
        }
    };

    const handleResize = useCallback(
        () =>
            controls.start({
                x: positions[activeItem],
                transition: {
                    ...transitionProps,
                },
            }),
        [activeItem, controls, positions]
    );

    const handleClick = useCallback(
        (event: MouseEvent) => {
            if (node.current && node.current.contains(event.target as Node)) {
                setTrackIsActive(true);
            } else {
                setTrackIsActive(false);
            }
        }, [setTrackIsActive]
    );

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (trackIsActive) {
                if (activeItem < positions.length - 1) {
                    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                        event.preventDefault();
                        setActiveItem((prev) => prev + 1);
                    }
                }
                if (activeItem > positions.length - positions.length) {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                        event.preventDefault();
                        setActiveItem((prev) => prev - 1);
                    }
                }
            }
        },
        [trackIsActive, setActiveItem, activeItem, positions.length]
    );

    useEffect(() => {
        handleResize();

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClick);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClick);
        };
    }, [handleClick, handleResize, handleKeyDown, positions]);

    return (
        <>
            {itemWidth && (
                <VStack ref={node} spacing={5} alignItems='stretch'>
                    <MotionFlex
                        dragConstraints={node}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        animate={controls}
                        style={{ x }}
                        drag='x'
                        _active={{ cursor: 'grabbing' }}
                        minWidth='min-content'
                        flexWrap='nowrap'
                        cursor='grab'
                    >
                        {children}
                    </MotionFlex>
                </VStack>
            )}
        </>
    );
};

interface ItemProps {
    children: ReactNode;
    setTrackIsActive: Dispatch<SetStateAction<boolean>>;
    setActiveItem: Dispatch<SetStateAction<number>>;
    activeItem: number;
    itemWidth: number;
    positions: number[];
    gap: number;
    index: number;
}
function Item(props: ItemProps) {
    const {
        children,
        setTrackIsActive,
        setActiveItem,
        activeItem,
        itemWidth,
        positions,
        gap,
        index
    } = props;
    const [userDidTab, setUserDidTab] = useState(false);

    const handleFocus = () => setTrackIsActive(true);

    const handleBlur = () => {
        userDidTab && index + 1 === positions.length && setTrackIsActive(false);
        setUserDidTab(false);
    };

    const handleKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) =>
        event.key === 'Tab' &&
        !(activeItem === positions.length - 1) &&
        setActiveItem(index);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => event.key === 'Tab' && setUserDidTab(true);
    return (
        <Flex
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyUp={handleKeyUp}
            onKeyDown={handleKeyDown}
            w={`${itemWidth}px`}
            _notLast={{ mr: `${gap}px` }}
            pb='4px'
        >
            {children}
        </Flex>
    );
};