import { MutableRefObject } from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, configure, render, screen } from '@testing-library/react';

import { mockGetTagsEmpty } from '@recipe/graphql/queries/__mocks__/tag';

import { TagDropdown } from '../TagDropdown';

// This test is split up into two because the delayed timeout causes
// other tests to erroneously fail.
configure({ asyncUtilTimeout: 1500 });

describe('TagDropdown', () => {
    afterEach(() => {
        cleanup();
        vi.resetAllMocks();
    });

    it('should not render the suggestions list when data is not available', async () => {
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
            <MockedProvider mocks={[mockGetTagsEmpty]}>
                <input ref={props.inputRef} />
                <TagDropdown {...props} />
            </MockedProvider>
        );

        // Assert
        expect(screen.findByText('dinner')).rejects.toThrow();
    });
});
