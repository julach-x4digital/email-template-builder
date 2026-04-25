# Email Template Builder - Enhanced Features

## Overview

This enhanced version of the email template builder includes a complete navigation system with dedicated pages for templates, editing, and preview, along with improved UX features.

## Key Features Implemented

### 1. Routing System
- **Route**: `/` → Redirects to `/templates`
- **Route**: `/templates` → Template gallery and management page
- **Route**: `/editor/:templateId?` → Editor with template ID parameter (optional for new templates)
- **Route**: `/preview` → Dedicated preview page with device frames

### 2. Top Navigation Bar

#### Left Section:
- App logo + "Email Template Builder" title
- "Choose Template" button → navigates to `/templates`
- Undo/Redo buttons (only visible in editor)

#### Center Section (Editor only):
- "Preview" button → navigates to `/preview`
- "Code View" button (`</>`) → opens modal with generated HTML

#### Right Section:
- **Device Toggle**: Desktop/Mobile view (segmented control)
- **Action Buttons**:
  - Copy (always available) → copies HTML to clipboard
  - Save (for new templates) → saves template with name prompt
  - Update (for existing templates) → updates existing template

### 3. Template Name Support
- Added `name` field to `EmailTemplate` type
- Template name modal appears when saving without a name
- Names are stored in both localStorage and API modes

### 4. Templates Page (`/templates`)

#### Without Backend:
- Shows templates from localStorage
- Falls back to 2 pre-defined mock templates
- Templates are editable and stored locally

#### With Backend:
- Fetches templates from API (`/api/gift-cards/email-templates`)
- Empty state shows "Create Template" button
- Full CRUD operations available

#### Template Cards:
- Display template name, description, and last updated date
- Actions: Edit (opens `/editor/[id]`) and Delete

### 5. Undo/Redo System
- Maintains history stack (max 10 states)
- Applied to all builder state changes
- Undo/Redo buttons in navigation bar
- Keyboard shortcuts supported

### 6. Preview Page (`/preview`)
- Dedicated preview page with no sidebars or editing UI
- Device frame preview using provided images
- Desktop view: Laptop frame mockup
- Mobile view: Smartphone frame mockup
- Proper scaling and positioning within device frames

### 7. Device Frame Preview
- **Desktop**: Uses laptop frame image with proper screen area positioning
- **Mobile**: Uses smartphone frame image with correct aspect ratio
- HTML is rendered inside the screen area of each device frame
- Responsive scaling to fit content properly

### 8. Enhanced Modals

#### Template Name Modal:
- Appears when saving templates without names
- Input validation and proper form handling
- Cancel/Create actions

#### Code View Modal:
- Shows generated HTML in a formatted code block
- Copy to clipboard functionality with success feedback
- Proper syntax highlighting and scrolling

### 9. Save/Copy/Update Logic

#### Without Backend:
- Only "Copy" button available
- Copies HTML to clipboard with toast notification

#### With Backend:
- New templates show "Save" button
- Existing templates show "Update" button
- Proper error handling and user feedback

### 10. Local Storage Support
- `getTemplatesFromStorage()` - Load all templates
- `saveTemplateToStorage()` - Save new template
- `updateTemplateInStorage()` - Update existing template
- `deleteTemplateFromStorage()` - Remove template
- `getTemplateFromStorage()` - Load single template by ID

### 11. Toast Notification System
- Success notifications for save/update/copy operations
- Error notifications for failed operations
- Auto-dismiss with configurable duration
- Clean, accessible design

## Technical Architecture

### State Management:
- Zustand store enhanced with template name support
- Router-aware state management
- History management for undo/redo functionality

### Component Structure:
```
src/
├── components/
│   ├── navigation/
│   │   └── TopNavbar.tsx          # Main navigation component
│   ├── modals/
│   │   ├── CodeViewModal.tsx      # HTML code display
│   │   └── TemplateNameModal.tsx  # Template naming
│   ├── preview/
│   │   └── DeviceFrame.tsx        # Device frame mockups
│   ├── ui/
│   │   └── Toast.tsx              # Notification system
│   └── layout/
│       └── AppWrapper.tsx         # API context provider
├── pages/
│   ├── TemplatesPage.tsx          # Template management
│   └── PreviewPage.tsx            # Dedicated preview
└── utils/
    └── localStorage.ts            # Local storage utilities
```

### Routing Integration:
- React Router DOM v6 with proper TypeScript support
- Route parameters for template IDs
- Navigation guards and fallbacks
- Context-aware routing

## Usage

### Development:
```bash
npm install
npm run dev
```

### Building:
```bash
npm run build
npm run build:lib  # For library distribution
```

## Browser Support
- Modern browsers with ES2020 support
- Local storage API required
- Clipboard API for copy functionality

## API Integration
- Backward compatible with existing API structure
- Template CRUD operations at `/api/gift-cards/email-templates`
- Graceful fallback to localStorage when API unavailable