import { useRef } from 'react';
import { FaUserClock } from 'react-icons/fa';
import { FiChevronRight } from 'react-icons/fi';
import { Link as ReactRouterLink } from 'react-router-dom';
import { Link as ChakraLink, Popover } from '@chakra-ui/react';
import { Box, Flex, Icon, Stack, Text } from '@chakra-ui/react';

import { Tooltip } from '../../../components/ui/tooltip';
import { NavItem, PUBLIC_NAV_ITEMS, USER_NAV_ITEMS } from '../constants';

interface DesktopNavProps {
    isLoggedIn: boolean;
    isVerified: boolean;
}
export function DesktopNav(props: DesktopNavProps) {
    const { isLoggedIn, isVerified } = props;
    const ref = useRef<HTMLAnchorElement>(null);
    const linkColor = 'gray.600';
    const linkHoverColor = 'gray.800';
    const popoverContentBgColor = 'white';
    const navItems = isVerified ? USER_NAV_ITEMS : PUBLIC_NAV_ITEMS;

    if (isLoggedIn && !isVerified) {
        return (
            <Tooltip content='Awaiting user verification' openDelay={500}>
                <span>
                    <Icon as={FaUserClock} color='gray.400' />
                </span>
            </Tooltip>
        );
    }

    return (
        <Stack direction='row' gap={4}>
            {navItems.map((navItem) => (
                <Box key={navItem.label}>
                    <Popover.Root>
                        <Popover.Trigger asChild>
                            <ChakraLink
                                p={2}
                                as={ReactRouterLink}
                                aria-label={navItem.ariaLabel}
                                href={navItem.href ?? '#'}
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
                        </Popover.Trigger>

                        {navItem.children && (
                            <Popover.Content
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
                            </Popover.Content>
                        )}
                    </Popover.Root>
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
            href={href}
            aria-label={ariaLabel}
            role='group'
            display='block'
            p={2}
            rounded='md'
            _hover={{ bg: 'white' }}
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
                    <Icon color='teal.400' w={5} h={5} as={FiChevronRight} />
                </Flex>
            </Stack>
        </ChakraLink>
    );
}
