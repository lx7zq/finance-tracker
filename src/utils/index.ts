import dayjs from 'dayjs'

export function getThisMonth(): string {
  return dayjs().format('YYYY-MM') // "2025-06"
}

export function formatMonth(month: string): string {
  return dayjs(month + '-01').format('MMMM YYYY') // "มิถุนายน 2025"
}