import { useRef } from 'react';
import { FaUserClock } from 'react-icons/fa';

import { Link as ReactRouterLink } from 'react-router-dom';
import { Tooltip, useColorModeValue } from '@chakra-ui/react';
import { Box, Flex, Icon, Stack, Text } from '@chakra-ui/react';
import { Link as ChakraLink, Popover, PopoverContent, PopoverTrigger } from '@chakra-ui/react';

import { NavItem, PUBLIC_NAV_ITEMS, USER_NAV_ITEMS } from '../constants';

interface DesktopNavProps {
    isLoggedIn: boolean;
    isVerified: boolean;
}
export function DesktopNav(props: DesktopNavProps) {
    const { isLoggedIn, isVerified } = props;
    const ref = useRef<HTMLAnchorElement>(null);
    const linkColor = useColorModeValue('gray.600', 'gray.200');
    const linkHoverColor = useColorModeValue('gray.800', 'white');
    const popoverContentBgColor = useColorModeValue('white', 'gray.800');
    const navItems = isVerified ? USER_NAV_ITEMS : PUBLIC_NAV_ITEMS;

    if (isLoggedIn && !isVerified) {
        return (
            <Tooltip label='Awaiting user verification' openDelay={500}>
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
