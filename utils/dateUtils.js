/**
 * Date utility functions
 */
export const dateUtils = {
    getTodayString: () => {
        return new Date().toISOString().split('T')[0];
    },

    isNewDay: (lastDate) => {
        if (!lastDate) return true;
        const today = dateUtils.getTodayString();
        return today !== lastDate;
    },

    getDaysDifference: (date1, date2) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
};
