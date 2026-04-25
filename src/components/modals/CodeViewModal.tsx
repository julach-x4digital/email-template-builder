import { useState } from 'react'
import { FiX, FiCopy, FiCheck } from 'react-icons/fi'

interface CodeViewModalProps {
  isOpen: boolean
  onClose: () => void
  html: string
}

export function CodeViewModal({ isOpen, onClose, html }: CodeViewModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Generated HTML Code</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              {copied ? (
                <>
                  <FiCheck className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <FiCopy className="h-4 w-4" />
                  Copy Code
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-100px)]">
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm overflow-auto">
            <code className="text-gray-800">{html}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}