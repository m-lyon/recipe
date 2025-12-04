export function generateRandomString(length: number): string {
    const characters: string = 'abcdefghijklmnopqrstuvwxyz';
    let result: string = '';
    for (let i: number = 0; i < length; i++) {
        const randomIndex: number = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}
