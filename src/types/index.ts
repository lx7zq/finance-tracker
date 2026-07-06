// Transaction type
export type TransactionType = 'income' | 'expense'

export type Category =
  | 'salary'
  | 'freelance' // income
  | 'food'
  | 'transport'
  | 'housing' // expense

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: Category
  description: string
  date: string // format: "YYYY-MM-DD"
  createdAt: string // ISO string
}

// Label mapping สำหรับ display
export const CATEGORY_LABELS: Record<Category, string> = {
  salary: 'เงินเดือน',
  freelance: 'Freelance',
  food: 'อาหาร',
  transport: 'การเดินทาง',
  housing: 'ที่พัก',
}
