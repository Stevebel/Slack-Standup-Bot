const START_HOUR = 9;

export function getStartTime(): Date {
    const date = new Date();
    date.setHours(START_HOUR, 0, 0, 0);
    return date;
}