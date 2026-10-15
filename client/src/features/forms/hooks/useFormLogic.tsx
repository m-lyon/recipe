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
    // The fields that failed validation, so a form can mark only those.
    const [invalidFields, setInvalidFields] = useState<ReadonlySet<string>>(new Set());

    useDeepCompareEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleSubmit = useCallback(() => {
        try {
            const validatedData = schema.validateSync(preValidationTransform(formData), {
                abortEarly: false,
            });
            onSubmit(validatedData);
        } catch (e: unknown) {
            setHasError(true);
            if (e instanceof ValidationError) {
                const errors = e.inner.length ? e.inner : [e];
                setInvalidFields(new Set(errors.map((err) => err.path ?? '')));
                toast({
                    title: `Error saving ${name}`,
                    description: errors[0].message,
                    position: 'top',
                });
            }
        }
    }, [formData, schema, onSubmit, toast, preValidationTransform, name]);

    const handleChange = useCallback((name: keyof TData, value: any) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setHasError(false);
        setInvalidFields(new Set());
    }, []);

    const setData = useCallback((data: Partial<TData>) => {
        setFormData(data);
        setHasError(false);
        setInvalidFields(new Set());
    }, []);

    const isInvalid = useCallback(
        (field: keyof TData) => invalidFields.has(String(field)),
        [invalidFields]
    );

    return { formData, hasError, isInvalid, handleSubmit, handleChange, setData };
}
