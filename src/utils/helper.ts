export function generateAlphanumericString(length: number = 8) {
    const characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; //

    const numbers: string = '0123456789';
    let result: string = '';

    for (let i = 0; i < length; i++) {
        const randomIndex: number = Math.floor(Math.random() * characters.length);
        const randomIndex2: number = Math.floor(Math.random() * numbers.length);
        result += characters[randomIndex];
        result += numbers[randomIndex2];
    }

    return result;
}

