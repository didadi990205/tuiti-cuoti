import type { AppData, Category, Question, Note, CategoryStat } from '@/types'

const STORAGE_KEY = 'tuiti-cuoti-data-v1'
const DATA_VERSION = 1

// 默认空数据（取消系统预设分类，全量自定义）
function createEmptyData(): AppData {
  return {
    version: DATA_VERSION,
    categories: [],
    questions: [],
    notes: [],
  }
}

// 安全读取：处理损坏数据、版本迁移
function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyData()
    const parsed = JSON.parse(raw) as AppData
    if (!parsed || typeof parsed !== 'object') return createEmptyData()
    return {
      version: DATA_VERSION,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    }
  } catch (e) {
    console.error('数据读取��败，重置为空', e)
    return createEmptyData()
  }
}

// 安全写入：try-catch处理quota超限
function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (e) {
    console.error('数据保存失败', e)
    // 配额超限时尝试清理imageThumb
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

// ID生成器
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

// ===== 对外API =====

export const store = {
  // 订阅变化
  subscribe(fn: Listener): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  // 获取当前快照
  getSnapshot(): AppData {
    return cache
  },

  // ===== 分类 =====
  addCategory(name: string): Category {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('分类名不能为空')
    const data = cache
    // 避免重名
    if (data.categories.some(c => c.name === trimmed)) {
      throw new Error('分类名已存在')
    }
    const maxOrder = data.categories.reduce((m, c) => Math.max(m, c.order), 0)
    const cat: Category = {
      id: genId(),
      name: trimmed,
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
    if (data.categories.some(c => c.id !== id && c.name === trimmed)) {
      throw new Error('分类名已存在')
    }
    persist({
      ...data,
      categories: data.categories.map(c => c.id === id ? { ...c, name: trimmed } : c),
    })
  },

  deleteCategory(id: string) {
    const data = cache
    persist({
      ...data,
      categories: data.categories.filter(c => c.id !== id),
      questions: data.questions.map(q => ({
        ...q,
        categoryIds: q.categoryIds.filter(cid => cid !== id),
      })),
      notes: data.notes.map(n => ({
        ...n,
        categoryIds: n.categoryIds.filter(cid => cid !== id),
      })),
    })
  },

  // 批量重排序（拖拽后传入新顺序的id数组）
  reorderCategories(orderedIds: string[]) {
    const data = cache
    const orderMap = new Map<string, number>()
    orderedIds.forEach((id, idx) => orderMap.set(id, idx + 1))
    persist({
      ...data,
      categories: data.categories
        .map(c => ({ ...c, order: orderMap.get(c.id) ?? c.order }))
        .sort((a, b) => a.order - b.order),
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
        reviewed: items.filter(q => q.reviewStatus === 'reviewed').length,
        mastered: items.filter(q => q.reviewStatus === 'mastered').length,
        easy: items.filter(q => q.difficulty === 'easy').length,
        medium: items.filter(q => q.difficulty === 'medium').length,
        hard: items.filter(q => q.difficulty === 'hard').length,
      }
    })
  },

  // 导出/导入（备份用）
  exportData(): string {
    return JSON.stringify(cache, null, 2)
  },

  importData(json: string): boolean {
    try {
      const parsed = JSON.parse(json) as AppData
      persist({
        version: DATA_VERSION,
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      })
      return true
    } catch {
      return false
    }
  },

  clearAll() {
    persist(createEmptyData())
  },
}
