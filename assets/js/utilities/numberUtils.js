export function getRandomInteger(min, max, excludeMin = null, excludeMax = null) {
    if (excludeMin !== null && excludeMax !== null) {
        if (excludeMin > excludeMax || excludeMin < min || excludeMax > max) {
            return false;
        }

        let random;
        do {
            random = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (random >= excludeMin && random <= excludeMax);

        return random;
    } else {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}