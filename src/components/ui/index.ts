// src/components/ui/index.ts
// Barrel export — RFC 019 T4 component atoms
// Pakai: import { Card, Badge, Button, Alert, Skeleton, EmptyState } from '@/components/ui'

export { Card } from './Card'
export { Badge } from './Badge'
export { Button } from './Button'
export { Alert } from './Alert'
export type { AlertVariant, AlertProps } from './Alert'
export { Skeleton, SkeletonText, SkeletonCard } from './SkeletonLoader'
export {
  EmptyState,
  EmptyFaceScan,
  EmptyIngredientScan,
  EmptyChatHistory,
  EmptyScanHistory,
} from './EmptyState'
