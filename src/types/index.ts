// 难度等级：简单/中等/困难
export type Difficulty = 'easy' | 'medium' | 'hard'

// 复盘状态：未复盘/已复盘/已掌握
export type ReviewStatus = 'pending' | 'reviewed' | 'mastered'

// 正确选项：A/B/C/D 或未设置
export type CorrectOption = 'A' | 'B' | 'C' | 'D' | null

// 自定义分类
export interface Category {
  id: string
  name: string
  order: number // 拖拽排序，越小越靠前
  createdAt: number
}

// 错题
export interface Question {
  id: string
  image: string // base64格式原图（压缩后）
  imageThumb?: string // 缩略图（用于列表展示，减少渲染压力）
  categoryIds: string[] // 多分类，可同时归属多个自定义分类
  correctOption: CorrectOption
  difficulty: Difficulty
  reviewStatus: ReviewStatus
  remark: string // 统一复盘备注
  createdAt: number
  updatedAt: number
}

// 知识点笔记
export interface Note {
  id: string
  title: string
  content: string // Markdown文本
  categoryIds: string[]
  images: string[] // base64图片数组
  createdAt: number
  updatedAt: number
}

// 应用持久化数据结构
export interface AppData {
  version: number
  categories: Category[]
  questions: Question[]
  notes: Note[]
}

// 统计看板数据
export interface CategoryStat {
  category: Category
  total: number
  pending: number
  reviewed: number
  mastered: number
  easy: number
  medium: number
  hard: number
}
