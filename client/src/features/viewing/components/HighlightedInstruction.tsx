import React from 'react';
import { Popover, Text } from '@mantine/core';
import { splitByKeyPhrases } from '@recipe/utils/keyPhrase';

interface HighlightedInstructionProps {
    text: string;
    keyPhrases: Array<{ value: string; description: string }>;
    /** Override default highlight style. Default: bold + teal colour. */
    highlightStyle?: React.CSSProperties;
}

const DEFAULT_HIGHLIGHT_STYLE: React.CSSProperties = {
    fontWeight: 'bold',
    color: 'teal',
    cursor: 'pointer',
};

export function HighlightedInstruction(props: HighlightedInstructionProps) {
    const { text, keyPhrases, highlightStyle = DEFAULT_HIGHLIGHT_STYLE } = props;
    const segments = splitByKeyPhrases(text, keyPhrases);

    return (
        <>
            {segments.map((segment, i) => {
                if (!segment.keyPhrase) {
                    return <React.Fragment key={i}>{segment.text}</React.Fragment>;
                }
                return (
                    <Popover key={i} width={240} position='top' withArrow shadow='md'>
                        <Popover.Target>
                            <span style={highlightStyle}>{segment.text}</span>
                        </Popover.Target>
                        <Popover.Dropdown>
                            <Text fw={700} size='sm'>
                                {segment.keyPhrase.value}
                            </Text>
                            <Text size='sm' mt={4}>
                                {segment.keyPhrase.description}
                            </Text>
                        </Popover.Dropdown>
                    </Popover>
                );
            })}
        </>
    );
}
