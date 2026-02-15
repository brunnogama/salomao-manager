export const formatDateToDisplay = (isoDate: string | null | undefined): string => {
    if (!isoDate) return '';
    // Check if it's already DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoDate)) return isoDate;

    // Handle YYYY-MM-DD
    // We append T12:00:00 to avoid timezone issues when using Date constructor, 
    // or just split string to be safer and faster.
    if (/^\d{4}-\d{2}-\d{2}/.test(isoDate)) {
        const [year, month, day] = isoDate.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
    }

    // Fallback for other formats (try Date object)
    const d = new Date(isoDate);
    if (!isNaN(d.getTime())) {
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const year = d.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }

    return isoDate;
};

export const formatDateToISO = (displayDate: string | null | undefined): string | null => {
    if (!displayDate) return null;

    // Check if it's DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(displayDate)) {
        const [day, month, year] = displayDate.split('/');
        return `${year}-${month}-${day}`;
    }

    // Check if already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(displayDate)) {
        return displayDate;
    }

    return null;
};
