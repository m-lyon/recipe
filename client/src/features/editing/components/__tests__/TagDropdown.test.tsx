import { MutableRefObject } from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, configure, render, screen } from '@testing-library/react';

import { TagDropdown } from '../TagDropdown';
import { mockGetManyTags, mockGetTags } from '../__mocks__/GetTags';

configure({ asyncUtilTimeout: 3000 });

describe('TagDropdown', () => {
    afterEach(() => {
        cleanup();
        vi.resetAllMocks();
    });

    it('should render the dropdown when tag.show is true', () => {
        // Arrange
        const props = {
            tag: {
                show: true,
                value: 'tag value',
            },
            actions: {
                setAndSubmit: vi.fn(),
                setShow: vi.fn(),
                reset: vi.fn(),
                setValue: vi.fn(),
                submit: vi.fn(),
            },
            inputRef: null as unknown as MutableRefObject<HTMLInputElement | null>,
            selectedTags: [],
        };

        // Act
        render(
            <MockedProvider mocks={[mockGetTags]}>
                <TagDropdown {...props} />
            </MockedProvider>
        );
        // Assert
        expect(screen.findByText('dinner')).not.toBeNull();
    });

    it('should render the dropdown when tag.show is true', async () => {
        // Arrange
        const props = {
            tag: {
                show: true,
                value: 'tag value',
            },
            actions: {
                setAndSubmit: vi.fn(),
                setShow: vi.fn(),
                reset: vi.fn(),
                setValue: vi.fn(),
                submit: vi.fn(),
            },
            inputRef: null as unknown as MutableRefObject<HTMLInputElement | null>,
            selectedTags: [],
        };

        // Act
        render(
            <MockedProvider mocks={[mockGetTags]}>
                <input ref={props.inputRef} />
                <TagDropdown {...props} />
            </MockedProvider>
        );

        // Assert
        expect(screen.findByText('dinner')).not.toBeNull();
    });

    it('should display a scrollbar when there are many tags', async () => {
        // Arrange
        const props = {
            tag: {
                show: true,
                value: 'tag value',
            },
            actions: {
                setAndSubmit: vi.fn(),
                setShow: vi.fn(),
                reset: vi.fn(),
                setValue: vi.fn(),
                submit: vi.fn(),
            },
            inputRef: null as unknown as MutableRefObject<HTMLInputElement | null>,
            selectedTags: [],
        };

        // Act
        render(
            <MockedProvider mocks={[mockGetManyTags]}>
                <TagDropdown {...props} />
            </MockedProvider>
        );

        // Assert
        const list = screen.getByRole('list');
        const computedStyle = window.getComputedStyle(list);
        expect(computedStyle.overflowY).toBe('auto');
    });

    it('should render the suggestions list when data is available', () => {
        // Arrange
        const props = {
            tag: {
                show: true,
                value: 'tag value',
            },
            actions: {
                setAndSubmit: vi.fn(),
                setShow: vi.fn(),
                reset: vi.fn(),
                setValue: vi.fn(),
                submit: vi.fn(),
            },
            inputRef: null as unknown as MutableRefObject<HTMLInputElement | null>,
            selectedTags: [],
        };

        // Act
        render(
            <MockedProvider mocks={[mockGetTags]}>
                <input ref={props.inputRef} />
                <TagDropdown {...props} />
            </MockedProvider>
        );

        // Assert
        expect(screen.findByText('dinner')).not.toBeNull();
        expect(screen.findByText('lunch')).not.toBeNull();
        expect(screen.findByText('freezable')).not.toBeNull();
    });
});
