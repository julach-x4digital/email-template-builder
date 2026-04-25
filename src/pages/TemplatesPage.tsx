import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import { useEmailBuilderApi } from '@/context/useEmailBuilderApi'
import { getTemplatesFromStorage, deleteTemplateFromStorage, type StoredTemplate } from '@/utils/localStorage'
import { listTemplateRecords, deleteTemplateRecord } from '@/utils/emailBuilderApi'
import { TopNavbar } from '@/components/navigation/TopNavbar'

interface TemplateCard {
  id: string
  name: string
  description?: string
  updatedAt: string
  previewHtml?: string
}

export function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const apiCfg = useEmailBuilderApi()

  const canUseCrud = apiCfg.api && !!apiCfg.templatesBaseUrl

  useEffect(() => {
    loadTemplates()
  }, [canUseCrud])

  const loadTemplates = async () => {
    setLoading(true)
    setError(null)

    try {
      if (canUseCrud) {
        // Load from API
        const apiTemplates = await listTemplateRecords(apiCfg.templatesBaseUrl!, {
          credentials: apiCfg.credentials,
        })
        
        const templateCards: TemplateCard[] = apiTemplates.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          updatedAt: t.updatedAt || t.createdAt || new Date().toISOString(),
        }))
        
        setTemplates(templateCards)
      } else {
        // Load from localStorage or show default templates
        const storedTemplates = getTemplatesFromStorage()
        
        if (storedTemplates.length > 0) {
          const templateCards: TemplateCard[] = storedTemplates.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            updatedAt: t.updatedAt,
          }))
          setTemplates(templateCards)
        } else {
          // Load from mock data if no stored templates
          const response = await fetch('/mock/email-templates.json')
          const data = await response.json()
          
          const mockTemplates: TemplateCard[] = data.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.template.description,
            updatedAt: item.updatedAt,
          }))
          
          setTemplates(mockTemplates)
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
      setError('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      if (canUseCrud) {
        await deleteTemplateRecord(apiCfg.templatesBaseUrl!, templateId, {
          credentials: apiCfg.credentials,
        })
      } else {
        deleteTemplateFromStorage(templateId)
      }
      
      // Reload templates
      await loadTemplates()
    } catch (err) {
      console.error('Failed to delete template:', err)
      setError('Failed to delete template')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar />
      
      <div className="container mx-auto px-4 pb-8 pt-24">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
            <p className="mt-2 text-gray-600">
              Create and manage your email templates
            </p>
          </div>
          
          <Link
            to="/editor"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 transition-colors"
          >
            <FiPlus className="h-4 w-4" />
            Create Template
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-lg bg-white border border-gray-200 p-12 text-center">
            <FiEdit2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No templates yet</h3>
            <p className="mt-2 text-gray-500">
              Get started by creating your first email template.
            </p>
            <Link
              to="/editor"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700 transition-colors"
            >
              <FiPlus className="h-4 w-4" />
              Create Template
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </div>
                
                <div className="mb-4 text-xs text-gray-500">
                  Updated {new Date(template.updatedAt).toLocaleDateString()}
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    to={`/editor/${template.id}`}
                    className="inline-flex items-center gap-1 rounded bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    <FiEdit2 className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="inline-flex items-center gap-1 rounded bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}