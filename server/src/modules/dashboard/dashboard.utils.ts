export interface MonthItem {
    label: string; // e.g. "Jan"
    year: number;
    monthIdx: number; // 0-11
}

/**
 * Returns the last 12 months ending in the current month.
 * Ordered chronologically (oldest to newest).
 */
export const getLast12MonthsList = (relativeTo: Date = new Date()): MonthItem[] => {
    const list: MonthItem[] = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date(relativeTo.getFullYear(), relativeTo.getMonth() - 11 + i, 1);
        const label = d.toLocaleString("en-US", { month: "short" });
        list.push({
            label,
            year: d.getFullYear(),
            monthIdx: d.getMonth()
        });
    }
    return list;
};

export const getMonthNames = (): string[] => [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
export const monthNames = getMonthNames();
