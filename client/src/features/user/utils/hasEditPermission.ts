export function hasEditPermission(user: CurrentUser, owner: string): boolean {
    if (!user) {
        return false;
    }
    return user._id === owner || user.role === 'admin';
}
