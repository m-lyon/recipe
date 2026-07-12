import { produce } from 'immer';
import { StateCreator } from 'zustand';

import { autoFormat } from '@recipe/utils/autoformat';

import { RecipeState } from './useRecipeStore';

interface InstructionLine {
    value: string;
    key: string;
}
interface Subsection {
    name?: string;
    instructions: InstructionLine[];
}
export interface InstructionSectionsSlice {
    instructionSections: Subsection[];
    addEmptyInstructionLine: (section: number) => void;
    insertInstructionLine: (section: number, index: number) => string;
    removeInstruction: (section: number, index: number) => void;
    setInstruction: (section: number, index: number, value: string) => void;
    setInstructionSection: (section: number, lines: string[], name?: string) => void;
    addInstructionSection: () => void;
    removeInstructionSection: (section: number) => void;
    setInstructionSectionName: (section: number, value: string) => void;
    resetInstructions: () => void;
}
function getEmptyLine() {
    return { value: '', key: crypto.randomUUID() };
}

export const createInstructionsSlice: StateCreator<
    RecipeState,
    [],
    [],
    InstructionSectionsSlice
> = (set) => ({
    instructionSections: [{ instructions: [getEmptyLine()] }],
    addEmptyInstructionLine: (index: number) =>
        set(
            produce((state: InstructionSectionsSlice) => {
                state.instructionSections[index].instructions.push(getEmptyLine());
            })
        ),
    insertInstructionLine: (section: number, index: number) => {
        // Returns the key of the line now following `index` — either a freshly
        // inserted blank or, if a blank already followed, the existing one
        // (idempotent: don't stack a blank next to an existing blank). The
        // caller uses this key to move focus to that line.
        let focusKey = '';
        set(
            produce((state: InstructionSectionsSlice) => {
                const lines = state.instructionSections[section].instructions;
                const next = lines[index + 1];
                if (next && next.value.trim() === '') {
                    focusKey = next.key;
                    return;
                }
                const line = getEmptyLine();
                lines.splice(index + 1, 0, line);
                focusKey = line.key;
            })
        );
        return focusKey;
    },
    removeInstruction: (section: number, index: number) =>
        set(
            produce((state: InstructionSectionsSlice) => {
                state.instructionSections[section].instructions.splice(index, 1);
            })
        ),
    setInstruction: (section: number, index: number, value: string) =>
        set(
            produce((state: InstructionSectionsSlice) => {
                state.instructionSections[section].instructions[index].value = autoFormat(value);
            })
        ),
    setInstructionSection: (section: number, lines: string[], name?: string) =>
        set(
            produce((state: InstructionSectionsSlice) => {
                state.instructionSections[section] = {
                    name,
                    instructions: lines.map((item) => {
                        return { value: item, key: crypto.randomUUID() };
                    }),
                };
            })
        ),
    addInstructionSection: () =>
        set(
            produce((state: InstructionSectionsSlice) => {
                state.instructionSections.push({ instructions: [getEmptyLine()] });
            })
        ),
    removeInstructionSection: (section: number) =>
        set(
            produce((state: InstructionSectionsSlice) => {
                state.instructionSections.splice(section, 1);
            })
        ),
    setInstructionSectionName: (section: number, value: string) =>
        set(
            produce((state: InstructionSectionsSlice) => {
                state.instructionSections[section].name = value;
            })
        ),
    resetInstructions: () =>
        set({
            instructionSections: [{ instructions: [getEmptyLine()] }],
        }),
});
