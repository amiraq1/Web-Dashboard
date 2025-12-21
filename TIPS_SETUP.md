# نصائح (Tips) Feature Setup

## Overview
This document explains how to set up and use the Tips feature that was added to the نبض (Nabd) dashboard.

## Database Schema
A new `tips` table has been added with the following structure:
- `id`: Unique identifier (UUID)
- `title`: Tip title (max 255 chars)
- `content`: Tip content (text)
- `category`: Category type (general, projects, tasks, files, chat, productivity)
- `icon`: Optional icon name
- `order`: Sort order (integer)
- `isActive`: Active status (boolean)
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp

## Setup Instructions

### 1. Push Database Schema
When running the application in the Replit environment with a configured DATABASE_URL, run:

```bash
npm run db:push
```

This will create the `tips` table in your PostgreSQL database.

### 2. Seed Initial Tips
To populate the database with initial tips data, run:

```bash
NODE_ENV=development tsx script/seed-tips.ts
```

Or from the Replit shell:

```bash
npx tsx script/seed-tips.ts
```

This will insert 12 helpful tips in Arabic across different categories.

## Features Included

### API Endpoints
- `GET /api/tips` - Get all active tips (with optional `?category=xxx` filter)
- `GET /api/tips/:id` - Get a specific tip
- `POST /api/tips` - Create a new tip (admin)
- `PATCH /api/tips/:id` - Update a tip (admin)
- `DELETE /api/tips/:id` - Delete a tip (admin)

### UI Components
1. **Tips Page** (`/tips`): Full page showing all tips with category filtering
2. **TipsCard Component**: Reusable card component for displaying individual tips
3. **Home Page Integration**: Shows 3 random tips on the dashboard
4. **Sidebar Navigation**: Added "نصائح" link to the main navigation

### Tip Categories
- `general`: General platform usage tips
- `projects`: Project management tips
- `tasks`: Task organization tips
- `files`: File management tips
- `chat`: Chat interface tips
- `productivity`: Productivity enhancement tips

## Usage

### Viewing Tips
Users can access tips in two ways:
1. **Dashboard**: See 3 featured tips on the home page
2. **Tips Page**: Visit `/tips` to see all tips with category filtering

### Adding New Tips
Tips can be added via API or directly in the database. Example:

```typescript
const newTip = {
  title: "عنوان النصيحة",
  content: "محتوى النصيحة التفصيلي",
  category: "general",
  icon: "lightbulb",
  order: 1,
  isActive: true
};

// POST to /api/tips
```

## Design Notes
- All text is in Arabic (RTL)
- Icons from Lucide React library
- Follows the existing design system with rounded corners, shadows, and hover effects
- Responsive grid layout (1 col mobile, 2 cols tablet, 3 cols desktop)

## Future Enhancements
Potential improvements:
- User-specific tips based on usage patterns
- Mark tips as read/dismissed
- Admin UI for managing tips
- Rich text formatting in tip content
- Attachments or links in tips
- Tip voting/rating system
