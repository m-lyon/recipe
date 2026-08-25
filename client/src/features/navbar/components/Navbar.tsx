import { Link as ChakraLink, VStack } from '@chakra-ui/react';
import { Box, Flex, IconButton, Slide } from '@chakra-ui/react';
import { useColorModeValue, useDisclosure } from '@chakra-ui/react';
import { ArrowBackIcon, CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
import { Outlet, Link as ReactRouterLink, ScrollRestoration, useLocation } from 'react-router-dom';

import { PATH } from '@recipe/constants';
import { useSearchStore } from '@recipe/stores';
import { UserOptions, useUser } from '@recipe/features/user';
import { SearchBar, useSearch } from '@recipe/features/search';
import { useBackNavigation, useStandalone } from '@recipe/common/hooks';

import { FlexNav } from './FlexNav';
import { MobileNav } from './MobileNav';
import { DesktopNav } from './DesktopNav';
import { SearchFilter } from './SearchFilter';
import { SelectedFilters } from './SelectedFilters';

export function Navbar() {
    const location = useLocation();
    const { isOpen, onToggle, onClose } = useDisclosure();
    const { setTitle, reset, resetToHome, addFilter, removeFilter, showArchived, setShowArchived } =
        useSearch();
    const setShowSearch = useSearchStore((state) => state.setShowSearch);
    const { isLoggedIn, isVerified } = useUser();
    const isStandalone = useStandalone();
    const goBack = useBackNavigation();

    const isHomePage = location.pathname === PATH.ROOT;
    // In standalone PWA mode there is no browser back button, so on sub-pages the
    // far-left slot shows a back button in place of the hamburger menu.
    const showBackButton = isStandalone && !isHomePage;

    return (
        <>
            <VStack as='nav' position='fixed' w='100%' zIndex={10}>
                <FlexNav>
                    <Flex
                        flex={{ base: 0, md: 'auto' }}
                        ml={{ base: -2 }}
                        display={{ base: 'flex', md: 'none' }}
                    >
                        {showBackButton ? (
                            <IconButton
                                onClick={goBack}
                                icon={<ArrowBackIcon w={5} h={5} />}
                                variant='ghost'
                                aria-label='Go back'
                            />
                        ) : (
                            <IconButton
                                onClick={() => {
                                    setShowSearch(false);
                                    onToggle();
                                }}
                                isDisabled={!isLoggedIn || !isVerified}
                                icon={
                                    isOpen ? (
                                        <CloseIcon w={3} h={3} />
                                    ) : (
                                        <HamburgerIcon w={5} h={5} />
                                    )
                                }
                                variant='ghost'
                                aria-label='Toggle Navigation'
                            />
                        )}
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
                                resetToHome();
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
                                <SearchBar
                                    setTitleFilter={setTitle}
                                    resetSearch={reset}
                                    closeNavDropdown={onClose}
                                />
                            </Box>
                        </Flex>
                        <UserOptions />
                    </Flex>
                </FlexNav>
                {isHomePage ? <SelectedFilters removeFilter={removeFilter} /> : undefined}
                {isHomePage ? (
                    <SearchFilter
                        addFilter={addFilter}
                        showArchived={showArchived}
                        setShowArchived={setShowArchived}
                    />
                ) : undefined}
                <Slide
                    in={isOpen}
                    direction='top'
                    style={{ zIndex: 11, marginTop: '60px' }}
                    transition={{ enter: { duration: 0.3 } }}
                >
                    <MobileNav isVerified={isVerified} parentOnToggle={onToggle} />
                </Slide>
            </VStack>
            <Outlet />
            <ScrollRestoration />
        </>
    );
}
