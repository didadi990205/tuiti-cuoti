import type { Category } from '@/types'

export interface CategoryTreeNode {
  category: Category
  children: CategoryTreeNode[]
}

// 将扁平分类数组构建成树（按 order 排序）
export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>()
  const roots: CategoryTreeNode[] = []

  // 先按 order 排序
  const sorted = [...categories].sort((a, b) => a.order - b.order)

  sorted.forEach(cat => {
    map.set(cat.id, { category: cat, children: [] })
  })

  sorted.forEach(cat => {
    const node = map.get(cat.id)!
    if (cat.parentId === null) {
      roots.push(node)
    } else {
      const parent = map.get(cat.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        // 父级不存在，降级为一级
        roots.push(node)
      }
    }
  })

  return roots
}

// 获取一个分类的所有后代（包含自身）
export function getCategoryDescendants(categories: Category[], parentId: string): string[] {
  const result: string[] = [parentId]
  const collect = (pid: string) => {
    categories
      .filter(c => c.parentId === pid)
      .forEach(c => {
        result.push(c.id)
        collect(c.id)
      })
  }
  collect(parentId)
  return result
}

// 格式化相对时间（如 4小时前）
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`
  if (diff < week) return `${Math.floor(diff / day)}天前`
  const d = new Date(timestamp)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// 颜色转rgba
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
