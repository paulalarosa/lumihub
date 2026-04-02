import {
  formatInTimeZone,
  toZonedTime as dateFnsToZonedTime,
} from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'

export const DEFAULT_TIMEZONE = 'America/Sao_Paulo'

export const formatDate = (
  date: Date | string | number,
  formatStr: string = 'dd/MM/yyyy HH:mm',
  timeZone: string = DEFAULT_TIMEZONE,
): string => {
  return formatInTimeZone(date, timeZone, formatStr, { locale: ptBR })
}

export const toZonedTime = (
  date: Date | string | number,
  timeZone: string = DEFAULT_TIMEZONE,
): Date => {
  return dateFnsToZonedTime(date, timeZone)
}

export const DATE_FORMATS = {
  FULL: "dd 'de' MMMM 'de' yyyy",
  WITH_TIME: 'dd/MM/yyyy HH:mm',
  SHORT: 'dd/MM/yyyy',
  DISPLAY: 'dd MMM yyyy',
  TIME: 'HH:mm',
}
