// 难度等级：1-5 星
export type Difficulty = 1 | 2 | 3 | 4 | 5

// 复盘状态：未复盘 / 1次复盘 / 多次复盘 / 已完全掌握
export type ReviewStatus = 'pending' | 'once' | 'many' | 'mastered'

// 正确选项：A/B/C/D 或未设置
export type CorrectOption = 'A' | 'B' | 'C' | 'D' | null

// 分类：一级分类 parentId=null，二级分类 parentId=父级id
export interface Category {
  id: string
  name: string
  parentId: string | null
  color: string
  order: number
  createdAt: number
}

// 错题
export interface Question {
  id: string
  image: string
  imageThumb?: string
  categoryIds: string[]
  correctOption: CorrectOption
  difficulty: Difficulty
  reviewStatus: ReviewStatus
  reviewCount: number
  remark: string
  createdAt: number
  updatedAt: number
}

// 知识点笔记
export interface Note {
  id: string
  title: string
  content: string
  categoryIds: string[]
  images: string[]
  createdAt: number
  updatedAt: number
}

export interface AppData {
  version: number
  categories: Category[]
  questions: Question[]
  notes: Note[]
}

export interface CategoryStat {
  category: Category
  total: number
  pending: number
  once: number
  many: number
  mastered: number
  oneStar: number
  twoStar: number
  threeStar: number
  fourStar: number
  fiveStar: number
}
