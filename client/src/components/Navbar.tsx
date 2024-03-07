import { Box, Flex, Text, IconButton } from '@chakra-ui/react';
import { Stack, Collapse, Icon, Link, Popover } from '@chakra-ui/react';
import { PopoverTrigger, PopoverContent, useColorModeValue } from '@chakra-ui/react';
import { useBreakpointValue, useDisclosure } from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { UserOptions } from './UserOptions';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Outlet } from 'react-router-dom';
import { ROOT_PATH } from '../constants';

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
                    zIndex={2}
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
                        <Link
                            textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
                            fontFamily='heading'
                            color={useColorModeValue('gray.800', 'white')}
                            _hover={{ textDecoration: 'none' }}
                            href={ROOT_PATH}
                        >
                            Home
                        </Link>

                        <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
                            <DesktopNav isLoggedIn={isLoggedIn} />
                        </Flex>
                    </Flex>
                    <UserOptions />
                </Flex>

                <Collapse in={isOpen} animateOpacity>
                    <MobileNav isLoggedIn={isLoggedIn} />
                </Collapse>
            </Box>
            <Outlet />
        </>
    );
}

interface DesktopNavProps {
    isLoggedIn: boolean;
}
const DesktopNav = (props: DesktopNavProps) => {
    const { isLoggedIn } = props;
    const linkColor = useColorModeValue('gray.600', 'gray.200');
    const linkHoverColor = useColorModeValue('gray.800', 'white');
    const popoverContentBgColor = useColorModeValue('white', 'gray.800');
    const navItems = isLoggedIn ? USER_NAV_ITEMS : PUBLIC_NAV_ITEMS;

    return (
        <Stack direction={'row'} spacing={4}>
            {navItems.map((navItem) => (
                <Box key={navItem.label}>
                    <Popover trigger={'hover'} placement={'bottom-start'}>
                        <PopoverTrigger>
                            <Link
                                p={2}
                                href={navItem.href ?? '#'}
                                fontSize='sm'
                                fontWeight={500}
                                color={linkColor}
                                _hover={{
                                    textDecoration: 'none',
                                    color: linkHoverColor,
                                }}
                            >
                                {navItem.label}
                            </Link>
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
};

const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
    return (
        <Link
            href={href}
            role={'group'}
            display={'block'}
            p={2}
            rounded={'md'}
            _hover={{ bg: useColorModeValue('pink.50', 'gray.900') }}
        >
            <Stack direction={'row'} align={'center'}>
                <Box>
                    <Text
                        transition={'all .3s ease'}
                        _groupHover={{ color: 'pink.400' }}
                        fontWeight={500}
                    >
                        {label}
                    </Text>
                    <Text fontSize={'sm'}>{subLabel}</Text>
                </Box>
                <Flex
                    transition={'all .3s ease'}
                    transform={'translateX(-10px)'}
                    opacity={0}
                    _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
                    justify={'flex-end'}
                    align={'center'}
                    flex={1}
                >
                    <Icon color={'pink.400'} w={5} h={5} as={ChevronRightIcon} />
                </Flex>
            </Stack>
        </Link>
    );
};

interface MobileNavProps {
    isLoggedIn: boolean;
}
const MobileNav = (props: MobileNavProps) => {
    const { isLoggedIn } = props;
    const navItems = isLoggedIn ? USER_NAV_ITEMS : PUBLIC_NAV_ITEMS;
    return (
        <Stack bg={useColorModeValue('white', 'gray.800')} p={4} display={{ md: 'none' }}>
            {navItems.map((navItem) => (
                <MobileNavItem key={navItem.label} {...navItem} />
            ))}
        </Stack>
    );
};

const MobileNavItem = ({ label, children, href }: NavItem) => {
    const { isOpen, onToggle } = useDisclosure();

    return (
        <Stack spacing={4} onClick={children && onToggle}>
            <Flex
                py={2}
                as={Link}
                href={href ?? '#'}
                justify={'space-between'}
                align={'center'}
                _hover={{
                    textDecoration: 'none',
                }}
            >
                <Text fontWeight={600} color={useColorModeValue('gray.600', 'gray.200')}>
                    {label}
                </Text>
                {children && (
                    <Icon
                        as={ChevronDownIcon}
                        transition={'all .25s ease-in-out'}
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
                    borderStyle={'solid'}
                    borderColor={useColorModeValue('gray.200', 'gray.700')}
                    align={'start'}
                >
                    {children &&
                        children.map((child) => (
                            <Link key={child.label} py={2} href={child.href}>
                                {child.label}
                            </Link>
                        ))}
                </Stack>
            </Collapse>
        </Stack>
    );
};

interface NavItem {
    label: string;
    subLabel?: string;
    children?: Array<NavItem>;
    href?: string;
}

const USER_NAV_ITEMS: Array<NavItem> = [
    {
        label: 'Create',
        href: `${ROOT_PATH}/create`,
    },
    {
        label: 'Search',
        href: `${ROOT_PATH}/search`,
    },
];

const PUBLIC_NAV_ITEMS: Array<NavItem> = [
    {
        label: 'Search',
        href: `${ROOT_PATH}/search`,
    },
];
