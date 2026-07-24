import { useSyncExternalStore } from 'react'
import { store } from '@/store'
import type { AppData } from '@/types'

// 使用React 18的useSyncExternalStore确保跨组件数据一致
export function useStore(): AppData {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot // SSR快照（此项目无SSR，复用即可）
  )
}
