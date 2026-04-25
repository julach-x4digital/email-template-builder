import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GrUndo, GrRedo } from 'react-icons/gr'
import { 
  FiEye,
  FiCode,
  FiCopy,
  FiSave,
  FiRefreshCw,
  FiMail,
  FiMonitor,
  FiSmartphone
} from 'react-icons/fi'
import { useEmailStore } from '@/store/emailStore'
import { useEmailBuilderApi } from '@/context/useEmailBuilderApi'
import { generateEmailHTML } from '@/utils/generateEmailHTML'
import { saveTemplateToStorage, updateTemplateInStorage } from '@/utils/localStorage'
import { createTemplateRecord, updateTemplateRecord } from '@/utils/emailBuilderApi'
import { CodeViewModal } from '@/components/modals/CodeViewModal'
import { TemplateNameModal } from '@/components/modals/TemplateNameModal'
import { useToast } from '@/components/ui/Toast'
import { FiArrowLeft } from 'react-icons/fi'

export function TopNavbar() {
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [saveAction, setSaveAction] = useState<'save' | 'update' | null>(null)
  const { addToast, ToastContainer } = useToast()
  
  const location = useLocation()
  const apiCfg = useEmailBuilderApi()

  const template = useEmailStore((s) => s.template)
  const undo = useEmailStore((s) => s.undo)
  const redo = useEmailStore((s) => s.redo)
  const past = useEmailStore((s) => s.past)
  const future = useEmailStore((s) => s.future)
  const previewDevice = useEmailStore((s) => s.previewDevice)
  const setPreviewDevice = useEmailStore((s) => s.setPreviewDevice)
  const activeTemplateId = useEmailStore((s) => s.activeTemplateId)
  const setActiveTemplateId = useEmailStore((s) => s.setActiveTemplateId)
  const updateDocument = useEmailStore((s) => s.updateDocument)

  const canUseCrud = apiCfg.api && !!apiCfg.templatesBaseUrl
  const isEditorPage = location.pathname.startsWith('/editor')
  const isPreviewPage = location.pathname === '/preview'
  const isNewTemplate = isEditorPage && !activeTemplateId
  const editorPath = activeTemplateId ? `/editor/${activeTemplateId}` : '/editor'

  const handleCopy = async () => {
    try {
      const html = generateEmailHTML(template)
      await navigator.clipboard.writeText(html)
      addToast('HTML copied to clipboard!', 'success')
    } catch (err) {
      console.error('Failed to copy:', err)
      addToast('Failed to copy HTML', 'error')
    }
  }

  const handleCodeView = () => {
    setShowCodeModal(true)
  }

  const handleSave = () => {
    if (!template.name && !template.documentName) {
      setSaveAction('save')
      setShowNameModal(true)
      return
    }
    performSave()
  }

  const handleUpdate = () => {
    if (!template.name && !template.documentName) {
      setSaveAction('update')
      setShowNameModal(true)
      return
    }
    performUpdate()
  }

  const performSave = async (templateName?: string) => {
    try {
      const nameToUse = templateName || template.name || template.documentName || 'Untitled Template'
      
      // Update template with name
      const updatedTemplate = {
        ...template,
        name: nameToUse,
        documentName: nameToUse,
      }
      
      updateDocument({ name: nameToUse, documentName: nameToUse })

      if (canUseCrud) {
        const html = generateEmailHTML(updatedTemplate)
        const payload = {
          name: nameToUse,
          description: updatedTemplate.description ?? '',
          html,
          template: updatedTemplate,
          isActive: true,
        }

        const { id } = await createTemplateRecord(apiCfg.templatesBaseUrl!, payload, {
          credentials: apiCfg.credentials,
          headers: apiCfg.exportUrl?.headers,
        })
        
        setActiveTemplateId(id)
        apiCfg.onExportSuccess?.(new Response(null, { status: 201, statusText: 'Created' }))
        addToast('Template saved successfully!', 'success')
      } else {
        saveTemplateToStorage(updatedTemplate)
        addToast('Template saved locally!', 'success')
      }
    } catch (err) {
      console.error('Failed to save template:', err)
      const error = err instanceof Error ? err : new Error(String(err))
      apiCfg.onExportError?.(error)
      addToast('Failed to save template', 'error')
    }
  }

  const performUpdate = async (templateName?: string) => {
    if (!activeTemplateId) return

    try {
      const nameToUse = templateName || template.name || template.documentName || 'Untitled Template'
      
      const updatedTemplate = {
        ...template,
        name: nameToUse,
        documentName: nameToUse,
      }
      
      updateDocument({ name: nameToUse, documentName: nameToUse })

      if (canUseCrud) {
        const html = generateEmailHTML(updatedTemplate)
        const payload = {
          name: nameToUse,
          description: updatedTemplate.description ?? '',
          html,
          template: updatedTemplate,
          isActive: true,
        }

        await updateTemplateRecord(
          apiCfg.templatesBaseUrl!,
          activeTemplateId,
          payload,
          { credentials: apiCfg.credentials, headers: apiCfg.exportUrl?.headers }
        )
        
        apiCfg.onExportSuccess?.(new Response(null, { status: 200, statusText: 'Updated' }))
        addToast('Template updated successfully!', 'success')
      } else {
        updateTemplateInStorage(activeTemplateId, {
          name: nameToUse,
          template: updatedTemplate,
        })
        addToast('Template updated locally!', 'success')
      }
    } catch (err) {
      console.error('Failed to update template:', err)
      const error = err instanceof Error ? err : new Error(String(err))
      apiCfg.onExportError?.(error)
      addToast('Failed to update template', 'error')
    }
  }

  const handleTemplateNameSubmit = (name: string) => {
    if (saveAction === 'save') {
      performSave(name)
    } else if (saveAction === 'update') {
      performUpdate(name)
    }
    setShowNameModal(false)
    setSaveAction(null)
  }

  return (
    <>
      <ToastContainer />
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white px-4 py-3 shadow-sm md:px-6">
        {/* Left Section */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex items-center gap-2">
              <FiMail className="h-5 w-5 shrink-0 text-indigo-600 md:h-6 md:w-6" />
              <span className="truncate text-base font-semibold text-gray-900 md:text-lg">
                Email Template Builder
              </span>
            </div>
            
            <div className="h-6 w-px bg-gray-200" />
            
            <Link
              to="/templates"
              className="whitespace-nowrap rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              Choose Template
            </Link>
            {isPreviewPage && (
              <Link
                to={editorPath}
                className="whitespace-nowrap rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 flex items-center gap-2"
              >
                <FiArrowLeft className="h-4 w-4" />
                Back to Editor
              </Link>
            )}
          </div>

          {isEditorPage && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!past.length}
                onClick={undo}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                title="Undo"
              >
                <GrUndo className="h-4 w-4" />
                <span className="hidden sm:inline">Undo</span>
              </button>
              
              <button
                type="button"
                disabled={!future.length}
                onClick={redo}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                title="Redo"
              >
                <GrRedo className="h-4 w-4" />
                <span className="hidden sm:inline">Redo</span>
              </button>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {/* Center Section */}
            {isEditorPage && (
              <>
                <Link
                  to="/preview"
                  className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  <FiEye className="h-4 w-4" />
                  Preview
                </Link>

                <button
                  type="button"
                  onClick={handleCodeView}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  title="Code view"
                >
                  <FiCode className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Device Toggle */}
            {(isEditorPage || isPreviewPage) && (
              <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    previewDevice === 'desktop'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiMonitor className="h-3 w-3" />
                  Desktop
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    previewDevice === 'mobile'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiSmartphone className="h-3 w-3" />
                  Mobile
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <FiCopy className="h-4 w-4" />
              Copy
            </button>

            {isEditorPage &&
              (isNewTemplate ? (
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  <FiSave className="h-4 w-4" />
                  Save
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  Update
                </button>
              ))}
          </div>
        </div>
      </nav>

      {/* Modals */}
      <CodeViewModal 
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        html={generateEmailHTML(template)}
      />
      
      <TemplateNameModal
        isOpen={showNameModal}
        onClose={() => {
          setShowNameModal(false)
          setSaveAction(null)
        }}
        onSubmit={handleTemplateNameSubmit}
        initialName={template.name || template.documentName || ''}
      />
    </>
  )
}