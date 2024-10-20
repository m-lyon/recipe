import { useCallback, useState } from 'react';
import { ObjectSchema, ValidationError } from 'yup';
import useDeepCompareEffect from 'use-deep-compare-effect';

import { useErrorToast } from '@recipe/common/hooks';

export function useFormLogic<TData>(
    schema: ObjectSchema<any>,
    preValidationTransform: (data: Partial<TData>) => any,
    initialData: Partial<TData>,
    onSubmit: (data: TData) => void,
    name: string = 'data'
) {
    const toast = useErrorToast();
    const [formData, setFormData] = useState<Partial<TData>>(initialData || {});
    const [hasError, setHasError] = useState(false);

    useDeepCompareEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

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

    const handleChange = useCallback((name: keyof TData, value: any) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setHasError(false);
    }, []);

    const setData = useCallback((data: Partial<TData>) => {
        setFormData(data);
        setHasError(false);
    }, []);

    return { formData, hasError, handleSubmit, handleChange, setData };
}
