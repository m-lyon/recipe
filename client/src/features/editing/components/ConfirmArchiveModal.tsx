import { ConfirmModal } from './ConfirmModal';
import { archiveRecipeConfirmConfig } from './confirmActionConfigs';

interface Props {
    show: boolean;
    setShow: (show: boolean) => void;
    onConfirm: () => void;
}
export function ConfirmArchiveModal(props: Props) {
    const { show, setShow, onConfirm } = props;

    return (
        <ConfirmModal
            show={show}
            setShow={setShow}
            title={archiveRecipeConfirmConfig.title}
            body={archiveRecipeConfirmConfig.body}
            cancelAriaLabel={archiveRecipeConfirmConfig.cancelAriaLabel}
            confirmAriaLabel={archiveRecipeConfirmConfig.confirmAriaLabel}
            onConfirm={onConfirm}
        />
    );
}
