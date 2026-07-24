// 难度等级：简单/中等/困难
export type Difficulty = 'easy' | 'medium' | 'hard'

// 复盘状态：未复盘 / 1次复盘 / 多次复盘 / 已完全掌握
export type ReviewStatus = 'pending' | 'once' | 'many' | 'mastered'

// 正确选项：A/B/C/D 或未设置
export type CorrectOption = 'A' | 'B' | 'C' | 'D' | null

// 分类：一级分类 parentId=null，二级分类 parentId=父级id
export interface Category {
  id: string
  name: string
  parentId: string | null
  color: string // 分类颜色，用于图片中的彩色圆点
  order: number // 拖拽排序，越小越靠前（同级内排序）
  createdAt: number
}

// 一级+二级分类组合选中状态（用于筛选/上传）
export interface CategorySelection {
  categoryId: string
  subIds: string[] // 选中的二级分类（可空）
}

// 错题
export interface Question {
  id: string
  image: string // base64格式原图（压缩后）
  imageThumb?: string // 缩略图（用于列表展示）
  categoryIds: string[] // 绑定的所有分类ID（可同时包含一级+二级）
  correctOption: CorrectOption
  difficulty: Difficulty
  reviewStatus: ReviewStatus
  reviewCount: number // 复盘次数：0未复盘，1一次，>=2多次
  remark: string // 统一复盘备注
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

// 应用持久化数据结构
export interface AppData {
  version: number
  categories: Category[]
  questions: Question[]
  notes: Note[]
}

// 分类统计
export interface CategoryStat {
  category: Category
  total: number
  pending: number
  once: number
  many: number
  mastered: number
  easy: number
  medium: number
  hard: number
}
