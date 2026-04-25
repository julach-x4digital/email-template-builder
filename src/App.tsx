import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { EmailBuilder } from '@/EmailBuilder'
import { TemplatesPage } from '@/pages/TemplatesPage'
import { PreviewPage } from '@/pages/PreviewPage'
import { AppWrapper } from '@/components/layout/AppWrapper'

function App() {
  return (
    <AppWrapper>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/templates" replace />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/editor/:templateId?" element={<EmailBuilder />} />
          <Route path="/preview" element={<PreviewPage />} />
        </Routes>
      </BrowserRouter>
    </AppWrapper>
  )
}

export default App
