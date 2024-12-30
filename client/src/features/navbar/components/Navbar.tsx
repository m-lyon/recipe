import { Link as ChakraLink } from '@chakra-ui/react';
import { CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
import { Box, Flex, IconButton, Slide } from '@chakra-ui/react';
import { useColorModeValue, useDisclosure } from '@chakra-ui/react';
import { Outlet, Link as ReactRouterLink, useLocation } from 'react-router-dom';

import { PATH } from '@recipe/constants';
import { UserOptions, useUser } from '@recipe/features/user';
import { SearchBar, useSearch } from '@recipe/features/search';

import { MobileNav } from './MobileNav';
import { DesktopNav } from './DesktopNav';

export function Navbar() {
    const location = useLocation();
    const { isOpen, onToggle, onClose } = useDisclosure();
    const { searchQuery, delayedSearchQuery, onSearch } = useSearch();
    const { isLoggedIn, isVerified } = useUser();

    const isHomePage = location.pathname === PATH.ROOT;

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
                    zIndex={12}
                    w='100%'
                >
                    <Flex
                        flex={{ base: 0, md: 'auto' }}
                        ml={{ base: -2 }}
                        display={{ base: 'flex', md: 'none' }}
                    >
                        <IconButton
                            onClick={onToggle}
                            isDisabled={!isLoggedIn || !isVerified}
                            icon={
                                isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
                            }
                            variant='ghost'
                            aria-label='Toggle Navigation'
                        />
                    </Flex>
                    <Flex
                        flex={{ base: 1 }}
                        justify={{ base: 'center', md: 'start' }}
                        alignItems='center'
                    >
                        <ChakraLink
                            textAlign={{ base: 'center', md: 'left' }}
                            fontFamily='heading'
                            color={useColorModeValue('gray.800', 'white')}
                            _hover={{ textDecoration: 'none' }}
                            to={PATH.ROOT}
                            as={ReactRouterLink}
                            aria-label='Navigate to home page'
                            onClick={() => {
                                if (delayedSearchQuery !== '') {
                                    onSearch('');
                                }
                                onClose();
                            }}
                            display={{ base: isHomePage ? 'none' : 'inline', md: 'inline' }}
                            width={{ base: '100%', md: 'auto' }}
                        >
                            Home
                        </ChakraLink>
                        <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
                            <DesktopNav isLoggedIn={isLoggedIn} isVerified={isVerified} />
                        </Flex>
                        <Flex
                            display={{ base: isHomePage ? 'flex' : 'none', md: 'flex' }}
                            width='100%'
                        >
                            <Box
                                ml='auto'
                                display={isHomePage ? 'flex' : 'none'}
                                pr={{ base: '0px', md: '20px' }}
                            >
                                <SearchBar searchQuery={searchQuery} onSearch={onSearch} />
                            </Box>
                        </Flex>
                        <UserOptions />
                    </Flex>
                </Flex>
                <Slide in={isOpen} direction='top' style={{ zIndex: 11, marginTop: '60px' }}>
                    <MobileNav isVerified={isVerified} parentOnToggle={onToggle} />
                </Slide>
            </Box>
            <Outlet context={{ delayedSearchQuery }} />
        </>
    );
}
