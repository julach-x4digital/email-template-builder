interface DeviceFrameProps {
  device: 'desktop' | 'mobile'
  html: string
}

export function DeviceFrame({ device, html }: DeviceFrameProps) {
  if (device === 'mobile') {
    return (
      <div className="mx-auto">
        <div className="relative w-[320px] rounded-[42px] border-[8px] border-slate-800 bg-slate-900 p-3 shadow-2xl">
          <div className="mx-auto mb-2 h-6 w-32 rounded-b-2xl bg-slate-800" />
          <div className="overflow-hidden rounded-[30px] border border-slate-700 bg-white">
            <iframe
              title="Mobile email preview"
              srcDoc={html}
              className="h-[640px] w-[300px] border-0 bg-white"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[980px]">
      <div className="rounded-t-2xl border-[10px] border-slate-800 bg-slate-900 p-3 shadow-2xl">
        <div className="overflow-hidden rounded-md bg-white">
          <iframe
            title="Desktop email preview"
            srcDoc={html}
            className="h-[560px] w-full border-0 bg-white"
          />
        </div>
      </div>
      <div className="mx-auto h-3 w-[92%] rounded-b-2xl bg-slate-700" />
      <div className="mx-auto h-2 w-[36%] rounded-b-xl bg-slate-500/80" />
    </div>
  )
}