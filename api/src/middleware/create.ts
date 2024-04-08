export const setRecordOwnerAsUser = () => (next) => async (rp) => {
    rp.args.record.owner = rp.context.getUser();
    return next(rp);
};
