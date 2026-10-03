import { List, ListItem, Tag, TagCloseButton, TagLabel } from '@chakra-ui/react';

import { ConversionRule } from './CreateConversionRuleForm';

interface Props {
    rules: ConversionRule[];
    baseUnit: ModifyableUnit | undefined;
    onRemove: (rule: ConversionRule) => void;
}
export function ConversionRuleList(props: Props) {
    const { rules, baseUnit, onRemove } = props;
    return (
        <List>
            {rules.map((rule) => (
                <ListItem key={rule._id}>
                    <Tag
                        maxW='100%'
                        whiteSpace='nowrap'
                        overflow='hidden'
                        textOverflow='ellipsis'
                        mb={2}
                    >
                        <TagLabel>
                            {rule.baseToUnitConversion} {baseUnit?.shortSingular} = 1{' '}
                            {rule.unit.shortSingular}, {baseUnit?.shortSingular} &gt;={' '}
                            {rule.baseUnitThreshold}
                        </TagLabel>
                        <TagCloseButton
                            aria-label={`Remove ${rule.unit.shortSingular} rule`}
                            onClick={(e) => {
                                e.preventDefault();
                                onRemove(rule);
                            }}
                        />
                    </Tag>
                </ListItem>
            ))}
        </List>
    );
}
