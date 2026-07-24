import { differenceInMonths, differenceInYears, addMonths, addYears, format } from "date-fns";

export function getAnniversaryInfo(startDate: Date) {
  const now = new Date();
  const months = differenceInMonths(now, startDate);
  const years = differenceInYears(now, startDate);

  const nextMonthly = addMonths(startDate, months + 1);
  const nextYearly = addYears(startDate, years + 1);

  const daysToNextMonth = Math.ceil((nextMonthly.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysToNextYear = Math.ceil((nextYearly.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    totalMonths: months,
    totalYears: years,
    nextMonthly: format(nextMonthly, "d MMMM yyyy"),
    nextYearly: format(nextYearly, "d MMMM yyyy"),
    daysToNextMonth,
    daysToNextYear,
    startDateFormatted: format(startDate, "d MMMM yyyy"),
  };
}
