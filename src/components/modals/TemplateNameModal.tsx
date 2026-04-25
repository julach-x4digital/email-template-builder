import { useState } from 'react'
import { FiX } from 'react-icons/fi'

interface TemplateNameModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string) => void
  initialName?: string
}

export function TemplateNameModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialName = '' 
}: TemplateNameModalProps) {
  const [name, setName] = useState(initialName)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (trimmedName) {
      onSubmit(trimmedName)
      setName('')
    }
  }

  const handleClose = () => {
    setName(initialName)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Template Name</h2>
          <button
            onClick={handleClose}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-2">
              Enter a name for your template
            </label>
            <input
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Welcome Email, Newsletter Template"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}