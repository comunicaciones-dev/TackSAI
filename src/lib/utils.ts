import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { type ComplianceStatus } from "@/lib/types";
import { parse, eachDayOfInterval, isWeekend, isSameDay, getYear, format as formatDate } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const getChileanHolidays = (year: number): Date[] => {
  // Static list of fixed holidays in Chile
  const holidays = [
    { month: 0, day: 1 },   // Año Nuevo
    { month: 4, day: 1 },   // Día del Trabajo
    { month: 4, day: 21 },  // Día de las Glorias Navales
    { month: 5, day: 29 },  // San Pedro y San Pablo
    { month: 6, day: 16 },  // Día de la Virgen del Carmen
    { month: 7, day: 15 },  // Asunción de la Virgen
    { month: 8, day: 18 },  // Independencia Nacional
    { month: 8, day: 19 },  // Día de las Glorias del Ejército
    { month: 9, day: 12 },  // Descubrimiento de Dos Mundos
    { month: 9, day: 31 },  // Día de las Iglesias Evangélicas y Protestantes
    { month: 10, day: 1 },  // Día de Todos los Santos
    { month: 11, day: 8 },  // Inmaculada Concepción
    { month: 11, day: 25 }, // Navidad
  ];

  // Note: This does not include movable holidays like Good Friday or election days.
  return holidays.map(h => new Date(year, h.month, h.day));
};

export const addBusinessDays = (startDate: Date, days: number): Date => {
    let currentDate = new Date(startDate);
    let businessDaysAdded = 0;
    const holidays = getChileanHolidays(getYear(currentDate));

    while (businessDaysAdded < days) {
        currentDate.setDate(currentDate.getDate() + 1);
        const isHoliday = holidays.some(holiday => isSameDay(currentDate, holiday));
        if (!isWeekend(currentDate) && !isHoliday) {
            businessDaysAdded++;
        }
    }
    return currentDate;
};

export function calculateDueDate(startDate: Date): Date {
  return addBusinessDays(startDate, 5);
}

export const parseDate = (dateStr: string): Date | null => {
  const dateFormats = ['dd/MM/yyyy', 'd/M/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd'];
  for (const format of dateFormats) {
    const parsed = parse(dateStr, format, new Date());
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

export function getComplianceStatus(businessDays: number): ComplianceStatus {
  if (businessDays <= 20) {
    return 'green';
  } else {
    return 'red';
  }
}

export function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function calculateBusinessDays(startDateStr: string, endDate?: Date): number | undefined {
    if (!endDate) return undefined;
    
    const startDate = parseDate(startDateStr);

    if (!startDate || isNaN(startDate.getTime())) return undefined;

    const interval = eachDayOfInterval({ start: startDate, end: endDate });
    const year = getYear(startDate);
    const chileanHolidays = getChileanHolidays(year);
    
    let businessDays = 0;
    
    for (const day of interval) {
        const isHoliday = chileanHolidays.some(holiday => isSameDay(day, holiday));
        if (!isWeekend(day) && !isHoliday) {
            businessDays++;
        }
    }
    
    return businessDays;
}

export { format } from 'date-fns';
