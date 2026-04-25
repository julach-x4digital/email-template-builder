import type { EmailTemplate } from '@/types'

const STORAGE_KEY = 'email-template-builder-templates'

export interface StoredTemplate {
  id: string
  name: string
  description?: string
  template: EmailTemplate
  createdAt: string
  updatedAt: string
}

export function getTemplatesFromStorage(): StoredTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveTemplateToStorage(template: EmailTemplate): StoredTemplate {
  const templates = getTemplatesFromStorage()
  const now = new Date().toISOString()
  
  const storedTemplate: StoredTemplate = {
    id: template.id,
    name: template.name || template.documentName || 'Untitled Template',
    description: template.description,
    template,
    createdAt: now,
    updatedAt: now,
  }

  const existingIndex = templates.findIndex(t => t.id === template.id)
  if (existingIndex >= 0) {
    storedTemplate.createdAt = templates[existingIndex]!.createdAt
    templates[existingIndex] = storedTemplate
  } else {
    templates.push(storedTemplate)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  return storedTemplate
}

export function updateTemplateInStorage(id: string, updates: Partial<Omit<StoredTemplate, 'id' | 'createdAt'>>): StoredTemplate | null {
  const templates = getTemplatesFromStorage()
  const index = templates.findIndex(t => t.id === id)
  
  if (index === -1) return null

  const updated: StoredTemplate = {
    ...templates[index]!,
    ...updates,
    id, // Ensure id doesn't change
    updatedAt: new Date().toISOString(),
  }

  templates[index] = updated
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  return updated
}

export function deleteTemplateFromStorage(id: string): boolean {
  const templates = getTemplatesFromStorage()
  const filtered = templates.filter(t => t.id !== id)
  
  if (filtered.length === templates.length) return false
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

export function getTemplateFromStorage(id: string): StoredTemplate | null {
  const templates = getTemplatesFromStorage()
  return templates.find(t => t.id === id) || null
}

export function clearTemplatesStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}