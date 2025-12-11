# تصميم منصة نبض - Design Guidelines

## Design Approach
**Reference-Based Approach** inspired by modern productivity platforms:
- **Primary References**: Linear (clean minimalism), Notion (flexible layouts), Asana (project views)
- **Adaptation**: RTL-first design for Arabic interface with enhanced visual hierarchy for AI-powered features
- **Key Principle**: Professional clarity meets intelligent assistance - every element serves the user's workflow

## RTL (Right-to-Left) Implementation
- All layouts mirror for Arabic: navigation on right, primary content flows right-to-left
- Command bar expands from right edge
- Project timelines flow right to left
- Icons and chevrons point in RTL-appropriate directions

## Typography Hierarchy

### Font Selection
- **Primary Arabic**: 'IBM Plex Sans Arabic' or 'Cairo' (Google Fonts)
- **Secondary/English**: 'Inter' or 'IBM Plex Sans'
- Both fonts loaded at weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Type Scale
- **Hero/Page Titles**: text-3xl md:text-4xl font-bold
- **Section Headers**: text-2xl font-semibold
- **Subsections**: text-xl font-semibold
- **Card Titles**: text-lg font-medium
- **Body Text**: text-base font-normal
- **Metadata/Labels**: text-sm font-medium
- **Captions**: text-xs font-normal

## Layout System

### Spacing Primitives
Use Tailwind units: **2, 3, 4, 6, 8, 12, 16, 24** for consistent rhythm
- Component padding: p-4 to p-6
- Section gaps: gap-6 to gap-8
- Page margins: px-4 md:px-8 lg:px-12
- Vertical spacing: space-y-6 to space-y-8

### Container Strategy
- **Full-width Sidebar**: Fixed 280px (w-70) on desktop, collapsible on mobile
- **Main Content**: max-w-7xl with px-8 padding
- **Nested Containers**: max-w-4xl for focused content areas
- **Cards/Panels**: Full width within containers with consistent p-6 padding

### Grid Patterns
- **Project Grid**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- **Task Lists**: Single column with dividers
- **File Browser**: grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4
- **Dashboard Stats**: grid-cols-2 md:grid-cols-4 gap-4

## Core Components

### Command Bar (Hero Feature)
- Fixed position at top, full-width with max-w-4xl centered
- Height: h-14, rounded-xl, prominent shadow-lg
- Input: Large text-lg with right-aligned placeholder
- Quick actions as icon buttons on left edge
- Keyboard shortcut badge (subtle, text-xs)

### Navigation Sidebar
- Full-height fixed panel (right side for RTL)
- Logo/branding at top (h-16)
- Navigation items: p-3 rounded-lg with icon + label
- Active state: subtle background with border-r-4 accent
- Bottom section: user profile + settings

### Project Cards
- Rounded-xl with border, p-6
- Header: Project name (text-lg font-semibold) + status badge
- Progress bar: h-2 rounded-full with percentage
- Metadata row: Icons + text-sm for date, agents, files
- Action buttons: Icon-only, grouped in top-left corner

### Task Items
- List layout with py-4 px-6, border-b
- Checkbox on right (RTL), title + description on left
- Priority indicator: Colored vertical bar (border-r-4)
- Metadata inline: assignee avatar, due date, tags
- Hover state reveals action icons

### Chat Interface
- Message bubbles: max-w-2xl with rounded-2xl
- User messages: Align right with subtle background
- AI responses: Align left with distinct styling
- Timestamp: text-xs below each message
- Input area: Fixed bottom with shadow-top

### File Browser
- Grid of file cards: aspect-square with rounded-lg
- File type icon centered, large (w-16 h-16)
- Filename truncated at 2 lines
- File size + date in text-xs below
- Hover: Lift effect with shadow-md

### Timeline View
- Vertical timeline line (border-r-2) on right side
- Timeline nodes: Circular indicators (w-4 h-4) with connecting lines
- Content cards expand to left with rounded-lg, p-4
- Status-based styling: success/error/pending indicators
- Timestamps in bold on far right

### Status Badges
- Small rounded-full px-3 py-1
- text-xs font-medium uppercase tracking-wide
- Variants: pending, running, completed, failed
- Icon prefix for quick recognition

### Buttons
Primary Action: px-6 py-3 rounded-lg text-base font-medium
- Secondary: Outlined variant with border-2
- Icon Buttons: p-2 rounded-md for toolbars
- Danger actions: Distinctive styling for delete/remove

### Modal Dialogs
- Overlay: backdrop-blur-sm
- Content: max-w-2xl rounded-2xl shadow-2xl p-8
- Header: text-2xl font-bold mb-6
- Footer: Buttons aligned left (RTL) with gap-3

## Dashboard Layout Structure

### Main Dashboard
1. **Top Bar** (fixed): Command bar + global actions
2. **Sidebar** (fixed right): Navigation + user profile
3. **Main Content** (scrollable):
   - Welcome header with user name + AI insights
   - Stats row (4 cards): Projects, Tasks, Files, AI Usage
   - Recent projects grid (3 columns)
   - Recent activity timeline

### Project Detail Page
1. **Header Section**: Project title, status, progress, actions
2. **Tabs Navigation**: Overview, Tasks, Files, Timeline, Settings
3. **Content Area**: Tab-specific layouts
4. **Side Panel** (collapsible): AI suggestions, quick stats

### File Manager
- Top: Breadcrumb navigation + view toggle (grid/list)
- Filters sidebar (collapsible): File type, date, size
- Main area: File grid with drag-drop support
- Preview panel (right side): File metadata + preview

## Interaction Patterns
- **Loading States**: Skeleton loaders matching content structure
- **Empty States**: Illustration + message + CTA button (centered)
- **Toasts/Notifications**: Top-center, slide-in animation, auto-dismiss
- **Dropdown Menus**: Rounded-lg shadow-lg with py-2
- **Tooltips**: Small rounded px-2 py-1 with arrow, text-xs
- **Form Inputs**: h-12 rounded-lg border with focus:ring-2

## Accessibility
- Focus rings: ring-2 ring-offset-2 on all interactive elements
- ARIA labels for icon-only buttons in Arabic
- Keyboard navigation support throughout
- Screen reader optimized content hierarchy
- Minimum touch target: 44x44px

## Images
**No hero images** - This is a utility dashboard, not a marketing site. Focus on functional clarity over visual decoration.