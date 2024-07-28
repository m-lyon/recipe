import { useContext, useRef } from 'react';
import { Outlet, Link as ReactRouterLink } from 'react-router-dom';
import { useBreakpointValue, useColorModeValue, useDisclosure } from '@chakra-ui/react';
import { Box, Collapse, Flex, Icon, IconButton, Slide, Stack, Text } from '@chakra-ui/react';
import { Link as ChakraLink, Popover, PopoverContent, PopoverTrigger } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon, CloseIcon, HamburgerIcon } from '@chakra-ui/icons';

import { ROOT_PATH } from '@recipe/constants';
import { UserContext, UserOptions } from '@recipe/features/user';

export function Navbar() {
    const { isOpen, onToggle } = useDisclosure();
    const [userContext] = useContext(UserContext);
    const isLoggedIn = userContext !== null && userContext !== false;

    return (
        <>
            <Box>
                <Flex
                    as='nav'
                    bg={useColorModeValue('white', 'gray.800')}
                    color={useColorModeValue('gray.600', 'white')}
                    minH='60px'
                    py={{ base: 2 }}
                    px={{ base: 4 }}
                    borderBottom={1}
                    borderStyle='solid'
                    borderColor={useColorModeValue('gray.200', 'gray.900')}
                    align='center'
                    position='fixed'
                    zIndex={3}
                    w='100%'
                >
                    <Flex
                        flex={{ base: 1, md: 'auto' }}
                        ml={{ base: -2 }}
                        display={{ base: 'flex', md: 'none' }}
                    >
                        <IconButton
                            onClick={onToggle}
                            icon={
                                isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
                            }
                            variant='ghost'
                            aria-label='Toggle Navigation'
                        />
                    </Flex>
                    <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
                        <ChakraLink
                            textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
                            fontFamily='heading'
                            color={useColorModeValue('gray.800', 'white')}
                            _hover={{ textDecoration: 'none' }}
                            to={ROOT_PATH}
                            as={ReactRouterLink}
                            aria-label='Navigate to home page'
                        >
                            Home
                        </ChakraLink>

                        <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
                            <DesktopNav isLoggedIn={isLoggedIn} />
                        </Flex>
                    </Flex>
                    <UserOptions />
                </Flex>
                <Slide in={isOpen} direction='top' style={{ zIndex: 2, marginTop: '60px' }}>
                    <MobileNav isLoggedIn={isLoggedIn} parentOnToggle={onToggle} />
                </Slide>
            </Box>
            <Outlet />
        </>
    );
}

interface DesktopNavProps {
    isLoggedIn: boolean;
}
function DesktopNav(props: DesktopNavProps) {
    const { isLoggedIn } = props;
    const ref = useRef<HTMLAnchorElement>(null);
    const linkColor = useColorModeValue('gray.600', 'gray.200');
    const linkHoverColor = useColorModeValue('gray.800', 'white');
    const popoverContentBgColor = useColorModeValue('white', 'gray.800');
    const navItems = isLoggedIn ? USER_NAV_ITEMS : PUBLIC_NAV_ITEMS;

    return (
        <Stack direction='row' spacing={4}>
            {navItems.map((navItem) => (
                <Box key={navItem.label}>
                    <Popover trigger='hover' placement='bottom-start' closeOnBlur>
                        <PopoverTrigger>
                            <ChakraLink
                                p={2}
                                as={ReactRouterLink}
                                aria-label={navItem.ariaLabel}
                                to={navItem.href ?? '#'}
                                fontSize='sm'
                                fontWeight={500}
                                color={linkColor}
                                _hover={{
                                    textDecoration: 'none',
                                    color: linkHoverColor,
                                }}
                                ref={ref}
                                onClick={() => ref.current?.blur()}
                            >
                                {navItem.label}
                            </ChakraLink>
                        </PopoverTrigger>

                        {navItem.children && (
                            <PopoverContent
                                border={0}
                                boxShadow='xl'
                                bg={popoverContentBgColor}
                                p={4}
                                rounded='xl'
                                minW='sm'
                            >
                                <Stack>
                                    {navItem.children.map((child) => (
                                        <DesktopSubNav key={child.label} {...child} />
                                    ))}
                                </Stack>
                            </PopoverContent>
                        )}
                    </Popover>
                </Box>
            ))}
        </Stack>
    );
}

function DesktopSubNav({ label, ariaLabel, href, subLabel }: NavItem) {
    const ref = useRef<HTMLAnchorElement>(null);

    return (
        <ChakraLink
            as={ReactRouterLink}
            to={href}
            aria-label={ariaLabel}
            role='group'
            display='block'
            p={2}
            rounded='md'
            _hover={{ bg: useColorModeValue('white', 'gray.900') }}
            ref={ref}
            onClick={() => ref.current?.blur()}
        >
            <Stack direction='row' align='center'>
                <Box>
                    <Text
                        transition='all .3s ease'
                        _groupHover={{ color: 'teal.400' }}
                        fontWeight={500}
                    >
                        {label}
                    </Text>
                    <Text fontSize='sm'>{subLabel}</Text>
                </Box>
                <Flex
                    transition='all .3s ease'
                    transform='translateX(-10px)'
                    opacity={0}
                    _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
                    justify='flex-end'
                    align='center'
                    flex={1}
                >
                    <Icon color='teal.400' w={5} h={5} as={ChevronRightIcon} />
                </Flex>
            </Stack>
        </ChakraLink>
    );
}

interface MobileNavProps {
    isLoggedIn: boolean;
    parentOnToggle: () => void;
}
function MobileNav(props: MobileNavProps) {
    const { isLoggedIn, parentOnToggle } = props;
    const navItems = isLoggedIn ? USER_NAV_ITEMS : PUBLIC_NAV_ITEMS;
    return (
        <Stack bg={useColorModeValue('white', 'gray.800')} display={{ md: 'none' }} width='100%'>
            {navItems.map((navItem) => (
                <MobileNavItem key={navItem.label} parentOnToggle={parentOnToggle} {...navItem} />
            ))}
        </Stack>
    );
}

function MobileNavItem({ label, ariaLabel, children, href, parentOnToggle }: NavItem) {
    const { isOpen, onToggle } = useDisclosure();

    return (
        <Stack spacing={4} onClick={children && onToggle}>
            <Flex
                py={2}
                px={4}
                as={ChakraLink}
                aria-label={ariaLabel}
                href={children ? undefined : href}
                justify='space-between'
                align='center'
                _hover={{ textDecoration: 'none' }}
                background={useColorModeValue('gray.100', 'gray.900')}
                minH='60px'
            >
                <Text fontWeight={500} color={useColorModeValue('gray.600', 'gray.200')}>
                    {label}
                </Text>
                {children && (
                    <Icon
                        as={ChevronDownIcon}
                        transition='all .25s ease-in-out'
                        transform={isOpen ? 'rotate(180deg)' : ''}
                        w={6}
                        h={6}
                    />
                )}
            </Flex>

            <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
                <Stack
                    mt={2}
                    pl={4}
                    borderLeft={1}
                    borderStyle='solid'
                    borderColor={useColorModeValue('gray.200', 'gray.700')}
                    align='start'
                >
                    {children &&
                        children.map((child) => (
                            <ChakraLink
                                key={child.label}
                                py={2}
                                to={child.href}
                                aria-label={child.ariaLabel}
                                as={ReactRouterLink}
                                onClick={parentOnToggle}
                            >
                                {child.label}
                            </ChakraLink>
                        ))}
                </Stack>
            </Collapse>
        </Stack>
    );
}

interface NavItem {
    label: string;
    ariaLabel?: string;
    subLabel?: string;
    children?: Array<NavItem>;
    href?: string;
    parentOnToggle?: () => void;
}
const USER_NAV_ITEMS: Array<NavItem> = [
    {
        label: 'Create',
        href: `${ROOT_PATH}/create/recipe`,
        children: [
            {
                label: 'Recipe',
                ariaLabel: 'Create new recipe',
                href: `${ROOT_PATH}/create/recipe`,
            },
            {
                label: 'Unit',
                ariaLabel: 'Create new unit',
                href: `${ROOT_PATH}/create/unit`,
            },
            {
                label: 'Ingredient',
                ariaLabel: 'Create new ingredient',
                href: `${ROOT_PATH}/create/ingredient`,
            },
            {
                label: 'Prep Method',
                ariaLabel: 'Create new prep method',
                href: `${ROOT_PATH}/create/prep-method`,
            },
            {
                label: 'Unit Conversion',
                ariaLabel: 'Create new unit conversion rule',
                href: `${ROOT_PATH}/create/unit-conversion`,
            },
        ],
    },
    {
        label: 'Edit',
        children: [
            {
                label: 'Unit',
                ariaLabel: 'Edit existing unit',
                href: `${ROOT_PATH}/edit/unit`,
            },
            {
                label: 'Ingredient',
                ariaLabel: 'Edit existing ingredient',
                href: `${ROOT_PATH}/edit/ingredient`,
            },
            {
                label: 'Prep Method',
                ariaLabel: 'Edit existing prep method',
                href: `${ROOT_PATH}/edit/prep-method`,
            },
        ],
    },
    {
        label: 'Search',
        ariaLabel: 'Search for recipes',
        href: `${ROOT_PATH}/search`,
    },
];

const PUBLIC_NAV_ITEMS: Array<NavItem> = [
    {
        label: 'Search',
        ariaLabel: 'Search for recipes',
        href: `${ROOT_PATH}/search`,
    },
];
