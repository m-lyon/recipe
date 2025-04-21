import { useRef, useState } from 'react';
import { FaUserClock } from 'react-icons/fa';
import { FaChevronRight } from 'react-icons/fa';
import { Link as ReactRouterLink } from 'react-router-dom';
import { Link as ChakraLink, Popover } from '@chakra-ui/react';
import { Box, Flex, Icon, Stack, Text } from '@chakra-ui/react';

import { Tooltip } from '@recipe/common/components';

import { NavItem, PUBLIC_NAV_ITEMS, USER_NAV_ITEMS } from '../constants';

interface DesktopNavProps {
    isLoggedIn: boolean;
    isVerified: boolean;
}
export function DesktopNav(props: DesktopNavProps) {
    const { isLoggedIn, isVerified } = props;
    const ref = useRef<HTMLAnchorElement>(null);
    const navItems = isVerified ? USER_NAV_ITEMS : PUBLIC_NAV_ITEMS;
    const [open, setOpen] = useState(false);

    if (isLoggedIn && !isVerified) {
        return (
            <Tooltip content='Awaiting user verification' showArrow openDelay={500}>
                <span>
                    <Icon color='gray.400'>
                        <FaUserClock />
                    </Icon>
                </span>
            </Tooltip>
        );
    }

    return (
        <Stack direction='row' gap={4}>
            {navItems.map((navItem) => (
                <Box key={navItem.label}>
                    <Popover.Root
                        open={open}
                        positioning={{ placement: 'bottom-start' }}
                        // closeOnBlur Not supported
                    >
                        <Popover.Trigger
                            onPointerEnter={() => setOpen(true)} // pretty sure this is not the right way to do it...
                            onPointerOut={() => setOpen(false)}
                        >
                            <ChakraLink
                                p={2}
                                aria-label={navItem.ariaLabel}
                                asChild
                                fontSize='sm'
                                fontWeight={500}
                                color='gray.600'
                                _hover={{
                                    textDecoration: 'none',
                                    color: 'gray.800',
                                }}
                                ref={ref}
                                onClick={() => ref.current?.blur()}
                            >
                                <ReactRouterLink to={navItem.href ?? '#'}>
                                    {navItem.label}
                                </ReactRouterLink>
                            </ChakraLink>
                        </Popover.Trigger>

                        {navItem.children && (
                            <Popover.Content
                                border={0}
                                boxShadow='xl'
                                bg='white'
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
            asChild
            aria-label={ariaLabel}
            role='group'
            display='block'
            p={2}
            rounded='md'
            _hover={{ bg: 'white' }}
            ref={ref}
            onClick={() => ref.current?.blur()}
        >
            <ReactRouterLink to={href ?? '#'}>
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
                        <Icon color='teal.400' w={5} h={5}>
                            <FaChevronRight />
                        </Icon>
                    </Flex>
                </Stack>
            </ReactRouterLink>
        </ChakraLink>
    );
}
