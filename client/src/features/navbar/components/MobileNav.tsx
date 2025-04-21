import { FaChevronDown } from 'react-icons/fa';
import { useDisclosure } from '@chakra-ui/react';
import { Link as ChakraLink } from '@chakra-ui/react';
import { Link as ReactRouterLink } from 'react-router-dom';
import { Collapsible, Flex, Icon, Stack, Text } from '@chakra-ui/react';

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

    const linkFlex = (
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
                    transition='all .25s ease-in-out'
                    transform={open ? 'rotate(180deg)' : ''}
                    w={6}
                    h={6}
                >
                    <FaChevronDown />
                </Icon>
            )}
        </Flex>
    );

    return (
        <Stack gap={0} onClick={children && onToggle}>
            <ChakraLink _hover={{ textDecoration: 'none' }} asChild={children ? false : true}>
                {children ? (
                    linkFlex
                ) : (
                    <ReactRouterLink to={href ?? '#'}>{linkFlex}</ReactRouterLink>
                )}
            </ChakraLink>
            <Collapsible.Root open={open} style={{ marginTop: '0!important' }}>
                <Collapsible.Content>
                    <Stack
                        mt={2}
                        mb={2}
                        pl={4}
                        borderLeft={1}
                        borderStyle='solid'
                        borderColor='gray.200'
                        align='start'
                    >
                        {children &&
                            children.map((child) => (
                                <ChakraLink
                                    key={child.label}
                                    py={2}
                                    aria-label={child.ariaLabel}
                                    asChild
                                    onClick={parentOnToggle}
                                    _hover={{ textDecoration: 'none' }}
                                >
                                    <ReactRouterLink to={child.href ?? '#'}>
                                        {child.label}
                                    </ReactRouterLink>
                                </ChakraLink>
                            ))}
                    </Stack>
                </Collapsible.Content>
            </Collapsible.Root>
        </Stack>
    );
}
