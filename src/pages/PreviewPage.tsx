import { useEmailStore } from '@/store/emailStore'
import { generateEmailHTML } from '@/utils/generateEmailHTML'
import { TopNavbar } from '@/components/navigation/TopNavbar'
import { DeviceFrame } from '@/components/preview/DeviceFrame'

export function PreviewPage() {
  const template = useEmailStore((s) => s.template)
  const previewDevice = useEmailStore((s) => s.previewDevice)

  const html = generateEmailHTML(template)

  return (
    <div className="min-h-screen bg-slate-100">
      <TopNavbar />

      <div className="mx-auto w-full max-w-7xl px-4 pb-6 pt-24">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            Preview: {template.name || template.documentName || 'Untitled Template'}
          </h1>
          <p className="mt-1 text-gray-600">
            Preview your email template in {previewDevice} view
          </p>
        </div>

        <div className="flex min-h-[72vh] items-start justify-center rounded-xl border border-slate-200 bg-slate-200/50 p-4 md:p-8">
          <DeviceFrame device={previewDevice} html={html} />
        </div>
      </div>
    </div>
  )
}