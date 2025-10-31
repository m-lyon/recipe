import { FiChevronDown } from 'react-icons/fi';
import { useDisclosure } from '@chakra-ui/react';
import { Link as ChakraLink } from '@chakra-ui/react';
import { Link as ReactRouterLink } from 'react-router-dom';
import { Flex, Icon, Stack, Text } from '@chakra-ui/react';

import { NavItem, PUBLIC_NAV_ITEMS, USER_NAV_ITEMS } from '../constants';

interface MobileNavProps {
    isVerified: boolean;
    parentOnToggle: () => void;
}
export function MobileNav(props: MobileNavProps) {
    const { isVerified, parentOnToggle } = props;
    const navItems = isVerified ? USER_NAV_ITEMS : PUBLIC_NAV_ITEMS;
    return (
        <Stack bg='white' display={{ md: 'none' }} width='100%'>
            {navItems.map((navItem) => (
                <MobileNavItem key={navItem.label} parentOnToggle={parentOnToggle} {...navItem} />
            ))}
        </Stack>
    );
}

function MobileNavItem({ label, ariaLabel, children, href, parentOnToggle }: NavItem) {
    const { open, onToggle } = useDisclosure();

    return (
        <Stack gap={0} onClick={children && onToggle}>
            <ChakraLink
                _hover={{ textDecoration: 'none' }}
                as={children ? undefined : ReactRouterLink}
                href={children ? undefined : href}
            >
                <Flex
                    py={2}
                    px={4}
                    aria-label={ariaLabel}
                    justify='space-between'
                    align='center'
                    background='gray.100'
                    minH='60px'
                >
                    <Text fontWeight={500} color='gray.600'>
                        {label}
                    </Text>
                    {children && (
                        <Icon
                            as={FiChevronDown}
                            transition='all .25s ease-in-out'
                            transform={open ? 'rotate(180deg)' : ''}
                            w={6}
                            h={6}
                        />
                    )}
                </Flex>
            </ChakraLink>
            <Collapse in={open} animateOpacity style={{ marginTop: '0!important' }}>
                <Stack
                    mt={2}
                    mb={2}
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
                                _hover={{ textDecoration: 'none' }}
                            >
                                {child.label}
                            </ChakraLink>
                        ))}
                </Stack>
            </Collapse>
        </Stack>
    );
}
