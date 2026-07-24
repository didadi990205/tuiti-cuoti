import type { AppData, Category, Question, Note, CategoryStat, ReviewStatus } from '@/types'

const STORAGE_KEY = 'tuiti-cuoti-data-v2'
const DATA_VERSION = 2

// 分类颜色预设（参考图片中的彩色圆点）
const CATEGORY_COLORS = [
  '#1677ff', // 蓝
  '#f5222d', // 红
  '#722ed1', // 紫
  '#52c41a', // 绿
  '#fa8c16', // 橙
  '#eb2f96', // 粉
  '#13c2c2', // 青
  '#fadb14', // 黄
  '#2f54eb', // 深蓝
  '#a0d911', // 嫩绿
]

export function getCategoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}

// 默认空数据
function createEmptyData(): AppData {
  return {
    version: DATA_VERSION,
    categories: [],
    questions: [],
    notes: [],
  }
}

// 从旧版本迁移
function migrateData(parsed: any): AppData {
  // 1.0 -> 2.0 迁移
  // - 旧分类没有 parentId, color
  // - 旧错题没有 reviewCount
  // - 旧 ReviewStatus: pending|reviewed|mastered -> pending|once|many|mastered
  const categories: Category[] = Array.isArray(parsed.categories) ? parsed.categories.map((c: any, idx: number) => ({
    id: c.id || genId(),
    name: c.name || '未命名',
    parentId: c.parentId ?? null,
    color: c.color || getCategoryColor(idx),
    order: c.order ?? idx + 1,
    createdAt: c.createdAt || Date.now(),
  })) : []

  const questions: Question[] = Array.isArray(parsed.questions) ? parsed.questions.map((q: any) => {
    let status: ReviewStatus = 'pending'
    let count = 0
    if (q.reviewStatus === 'mastered') {
      status = 'mastered'
      count = q.reviewCount ?? 2
    } else if (q.reviewStatus === 'reviewed') {
      status = 'once'
      count = 1
    } else if (q.reviewStatus === 'once' || q.reviewStatus === 'many') {
      status = q.reviewStatus
      count = q.reviewCount ?? (status === 'once' ? 1 : 2)
    }
    return {
      id: q.id || genId(),
      image: q.image || '',
      imageThumb: q.imageThumb,
      categoryIds: Array.isArray(q.categoryIds) ? q.categoryIds : [],
      correctOption: q.correctOption ?? null,
      difficulty: q.difficulty || 'medium',
      reviewStatus: status,
      reviewCount: count,
      remark: q.remark || '',
      createdAt: q.createdAt || Date.now(),
      updatedAt: q.updatedAt || Date.now(),
    }
  }) : []

  const notes: Note[] = Array.isArray(parsed.notes) ? parsed.notes.map((n: any) => ({
    id: n.id || genId(),
    title: n.title || '',
    content: n.content || '',
    categoryIds: Array.isArray(n.categoryIds) ? n.categoryIds : [],
    images: Array.isArray(n.images) ? n.images : [],
    createdAt: n.createdAt || Date.now(),
    updatedAt: n.updatedAt || Date.now(),
  })) : []

  // 修复旧版没有 parentId 的分类：全部变成一级分类
  categories.forEach(c => {
    if (c.parentId === undefined) c.parentId = null
  })

  // 修复颜色
  categories.forEach((c, idx) => {
    if (!c.color) c.color = getCategoryColor(idx)
  })

  return { version: DATA_VERSION, categories, questions, notes }
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyData()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return createEmptyData()

    // 兼容旧 key 名，如果 v2 没有尝试 v1
    if (parsed.version === DATA_VERSION) {
      return migrateData(parsed)
    }
    // 旧版本数据，执行迁移
    return migrateData(parsed)
  } catch (e) {
    console.error('数据读取失败，重置为空', e)
    return createEmptyData()
  }
}

// 安全写入
function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (e) {
    console.error('数据保存失败', e)
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      try {
        const stripped: AppData = {
          ...data,
          questions: data.questions.map(q => ({ ...q, imageThumb: undefined })),
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped))
        return true
      } catch {
        return false
      }
    }
    return false
  }
}

// 简单事件订阅
type Listener = () => void
const listeners = new Set<Listener>()
let cache: AppData = loadData()

function emit() {
  listeners.forEach(fn => fn())
}

function persist(next: AppData) {
  cache = next
  saveData(next)
  emit()
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

// 工具：获取分类在同级中的最大order
function getMaxOrder(categories: Category[], parentId: string | null): number {
  return categories
    .filter(c => c.parentId === parentId)
    .reduce((m, c) => Math.max(m, c.order), 0)
}

// ===== 对外API =====
export const store = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  getSnapshot(): AppData {
    return cache
  },

  // ===== 分类 =====
  addCategory(name: string, parentId: string | null = null): Category {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('分类名不能为空')
    const data = cache

    // 同级下不重名
    const siblings = data.categories.filter(c => c.parentId === parentId)
    if (siblings.some(c => c.name === trimmed)) {
      throw new Error(parentId ? '该分类下已存在同名子分类' : '已存在同名一级分类')
    }

    const maxOrder = getMaxOrder(data.categories, parentId)
    const allCount = data.categories.length
    const cat: Category = {
      id: genId(),
      name: trimmed,
      parentId,
      color: getCategoryColor(allCount),
      order: maxOrder + 1,
      createdAt: Date.now(),
    }
    persist({ ...data, categories: [...data.categories, cat] })
    return cat
  },

  renameCategory(id: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('分类名不能为空')
    const data = cache
    const target = data.categories.find(c => c.id === id)
    if (!target) throw new Error('分类不存在')
    const siblings = data.categories.filter(c => c.parentId === target.parentId && c.id !== id)
    if (siblings.some(c => c.name === trimmed)) {
      throw new Error('同级分类名已存在')
    }
    persist({
      ...data,
      categories: data.categories.map(c => c.id === id ? { ...c, name: trimmed } : c),
    })
  },

  deleteCategory(id: string) {
    const data = cache
    // 删除该分类及其所有子分类
    const idsToDelete = new Set<string>([id])
    const collectChildren = (parentId: string) => {
      data.categories.forEach(c => {
        if (c.parentId === parentId) {
          idsToDelete.add(c.id)
          collectChildren(c.id)
        }
      })
    }
    collectChildren(id)

    persist({
      ...data,
      categories: data.categories.filter(c => !idsToDelete.has(c.id)),
      questions: data.questions.map(q => ({
        ...q,
        categoryIds: q.categoryIds.filter(cid => !idsToDelete.has(cid)),
      })),
      notes: data.notes.map(n => ({
        ...n,
        categoryIds: n.categoryIds.filter(cid => !idsToDelete.has(cid)),
      })),
    })
  },

  // 批量重排序：传入同级新顺序id数组（包括parentId相同的二级分类）
  reorderCategories(orderedIds: string[]) {
    const data = cache
    const orderMap = new Map<string, number>()
    orderedIds.forEach((id, idx) => orderMap.set(id, idx + 1))
    persist({
      ...data,
      categories: data.categories
        .map(c => ({ ...c, order: orderMap.get(c.id) ?? c.order }))
        .sort((a, b) => {
          // 一级分类在前，二级按父级分组
          if (a.parentId === b.parentId) return a.order - b.order
          if (a.parentId === null && b.parentId !== null) return -1
          if (a.parentId !== null && b.parentId === null) return 1
          return 0
        }),
    })
  },

  // ===== 错题 =====
  addQuestion(q: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Question {
    const data = cache
    const now = Date.now()
    const question: Question = {
      ...q,
      id: genId(),
      createdAt: now,
      updatedAt: now,
    }
    persist({ ...data, questions: [question, ...data.questions] })
    return question
  },

  updateQuestion(id: string, patch: Partial<Question>) {
    const data = cache
    persist({
      ...data,
      questions: data.questions.map(q =>
        q.id === id ? { ...q, ...patch, updatedAt: Date.now() } : q
      ),
    })
  },

  deleteQuestion(id: string) {
    const data = cache
    persist({ ...data, questions: data.questions.filter(q => q.id !== id) })
  },

  // 点击一次复盘：状态自动流转
  reviewQuestion(id: string) {
    const data = cache
    persist({
      ...data,
      questions: data.questions.map(q => {
        if (q.id !== id) return q
        const count = q.reviewCount + 1
        let status: ReviewStatus = 'once'
        if (count >= 2) status = 'many'
        if (q.reviewStatus === 'mastered') status = 'mastered' // 已掌握保持
        return { ...q, reviewCount: count, reviewStatus: status, updatedAt: Date.now() }
      }),
    })
  },

  // 直接设置掌握状态（可手动切换）
  masterQuestion(id: string, mastered: boolean) {
    this.updateQuestion(id, {
      reviewStatus: mastered ? 'mastered' : 'pending',
      reviewCount: mastered ? Math.max(2, this.getSnapshot().questions.find(q => q.id === id)?.reviewCount || 0) : 0,
    })
  },

  // ===== 知识点笔记 =====
  addNote(n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
    const data = cache
    const now = Date.now()
    const note: Note = { ...n, id: genId(), createdAt: now, updatedAt: now }
    persist({ ...data, notes: [note, ...data.notes] })
    return note
  },

  updateNote(id: string, patch: Partial<Note>) {
    const data = cache
    persist({
      ...data,
      notes: data.notes.map(n =>
        n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n
      ),
    })
  },

  deleteNote(id: string) {
    const data = cache
    persist({ ...data, notes: data.notes.filter(n => n.id !== id) })
  },

  // ===== 统计 =====
  getCategoryStats(): CategoryStat[] {
    const data = cache
    const sorted = [...data.categories].sort((a, b) => a.order - b.order)
    return sorted.map(category => {
      const items = data.questions.filter(q => q.categoryIds.includes(category.id))
      return {
        category,
        total: items.length,
        pending: items.filter(q => q.reviewStatus === 'pending').length,
        once: items.filter(q => q.reviewStatus === 'once').length,
        many: items.filter(q => q.reviewStatus === 'many').length,
        mastered: items.filter(q => q.reviewStatus === 'mastered').length,
        easy: items.filter(q => q.difficulty === 'easy').length,
        medium: items.filter(q => q.difficulty === 'medium').length,
        hard: items.filter(q => q.difficulty === 'hard').length,
      }
    })
  },

  exportData(): string {
    return JSON.stringify(cache, null, 2)
  },

  importData(json: string): boolean {
    try {
      const parsed = JSON.parse(json)
      persist(migrateData(parsed))
      return true
    } catch {
      return false
    }
  },

  clearAll() {
    persist(createEmptyData())
  },
}
