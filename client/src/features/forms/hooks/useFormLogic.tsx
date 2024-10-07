import { ObjectSchema, ValidationError } from 'yup';
import { useCallback, useEffect, useState } from 'react';

import { useErrorToast } from '@recipe/common/hooks';

export function useFormLogic<T>(
    schema: ObjectSchema<any>,
    initialData: T | undefined,
    onSubmit: (data: T) => void,
    errorTitle: string = 'Error saving data'
) {
    const toast = useErrorToast();
    const [formData, setFormData] = useState<Partial<T>>(initialData || {});
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleSubmit = useCallback(() => {
        try {
            const validatedData = schema.validateSync(formData);
            onSubmit(validatedData);
        } catch (e: unknown) {
            setHasError(true);
            if (e instanceof ValidationError) {
                toast({
                    title: errorTitle,
                    description: e.message,
                    position: 'top',
                });
            }
        }
    }, [formData, schema, onSubmit, toast, errorTitle]);

    const handleChange = useCallback((name: keyof T, value: any) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setHasError(false);
    }, []);

    return { formData, hasError, handleSubmit, handleChange };
}
