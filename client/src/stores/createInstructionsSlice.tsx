import { produce } from 'immer';
import { StateCreator } from 'zustand';

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
    removeInstruction: (section: number, index: number) =>
        set(
            produce((state: InstructionSectionsSlice) => {
                state.instructionSections[section].instructions.splice(index, 1);
            })
        ),
    setInstruction: (section: number, index: number, value: string) =>
        set(
            produce((state: InstructionSectionsSlice) => {
                state.instructionSections[section].instructions[index].value = value;
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
