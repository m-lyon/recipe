export function normalisePort(val: string): number {
    let port = parseInt(val, 10);
    if (port >= 0) {
        // port number
        return port;
    }
    throw new Error('Invalid port');
}
