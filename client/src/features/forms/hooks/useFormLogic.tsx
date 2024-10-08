import { ObjectSchema, ValidationError } from 'yup';
import { useCallback, useEffect, useState } from 'react';

import { useErrorToast } from '@recipe/common/hooks';

export function useFormLogic<T>(
    schema: ObjectSchema<any>,
    initialData: Partial<T> | undefined,
    onSubmit: (data: T) => void,
    name: string = 'data',
    preValidationTransform: (data: Partial<T>) => Partial<T> = (data) => data,
    disabledData?: false | Partial<T>
) {
    const toast = useErrorToast();
    const [formData, setFormData] = useState<Partial<T>>(initialData || {});
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (disabledData) {
            setFormData(disabledData);
        } else if (initialData) {
            setFormData(initialData);
        }
    }, [initialData, disabledData]);

    const handleSubmit = useCallback(() => {
        try {
            const validatedData = schema.validateSync(preValidationTransform(formData));
            onSubmit(validatedData);
        } catch (e: unknown) {
            setHasError(true);
            if (e instanceof ValidationError) {
                toast({
                    title: `Error saving ${name}`,
                    description: e.message,
                    position: 'top',
                });
            }
        }
    }, [formData, schema, onSubmit, toast, preValidationTransform, name]);

    const handleChange = useCallback((name: keyof T, value: any) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setHasError(false);
    }, []);

    return { formData, hasError, handleSubmit, handleChange };
}
