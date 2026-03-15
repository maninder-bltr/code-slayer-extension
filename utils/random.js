/**
 * Utility for random generations
 */
export const randomUtils = {
    getRandomElement: (array) => {
        return array[Math.floor(Math.random() * array.length)];
    },

    uuid: () => {
        return Math.random().toString(36).substring(2, 11);
    }
};
