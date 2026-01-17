# Code Implementation Examples

## 1. Display Name Formatting

The `getDisplayName()` function elegantly handles both cases:

```typescript
const getDisplayName = (memorial: any) => {
  if (memorial.popularName) {
    return `${memorial.popularName} • ${memorial.fullName}`;
  }
  return memorial.fullName;
};
```

### Example Usage:
```
// With popular name:
Chico Science • Francisco de Assis França

// Without popular name:
Francisco de Assis França
```

## 2. Enhanced Search Filtering

Search now looks across multiple fields:

```typescript
const filteredMemorials = memorials?.filter(m =>
  m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  (m.popularName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
  (m.biography?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
);
```

### Search Examples:
- Search "Chico" → Finds memorials with popular name
- Search "Francisco" → Finds memorials with full name
- Search "manguebeat" → Finds memorials with this in biography
- Search "musician" → Finds any memorial mentioning it

## 3. Schema Update

Added to memorials table:

```typescript
export const memorials = pgTable("memorials", {
  // ... existing fields ...
  popularName: varchar("popular_name", { length: 255 }),
  // ... rest of fields ...
});
```

### Example Data:
```typescript
{
  id: 1,
  fullName: "Francisco de Assis França",
  popularName: "Chico Science",  // ← NEW FIELD
  birthDate: "1966-02-17",
  deathDate: "1997-02-02",
  biography: "Chico Science foi um cantor...",
  // ... other fields ...
}
```

## 4. Card Component Styling

Modern card design with hover effects:

```tsx
<Card
  className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-gray-200/50 overflow-hidden"
  onClick={() => router.push(`/memorial/${memorial.slug}`)}
>
  {/* Image with hover scale effect */}
  <img
    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
  />
  
  {/* Title with hover color change */}
  <h3 className="font-bold text-lg text-gray-900 group-hover:text-teal-700 transition-colors">
    {getDisplayName(memorial)}
  </h3>
</Card>
```

## 5. Button Styling

Modern gradient buttons with smooth transitions:

```tsx
<Button
  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
  onClick={(e) => {
    e.stopPropagation();
    router.push(`/memorial/${memorial.slug}`);
  }}
>
  Ver Memorial Completo
</Button>
```

## 6. Background Animations

Animated gradient orbs with CSS animations:

```tsx
<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
  <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 float"></div>
  <div className="absolute top-40 right-10 w-72 h-72 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 float" style={{ animationDelay: '2s' }}></div>
  <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 float" style={{ animationDelay: '4s' }}></div>
</div>
```

## 7. Responsive Grid Layout

Adapts from 1 column (mobile) to 3 columns (desktop):

```tsx
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {filteredMemorials.map((memorial) => (
    // Card component
  ))}
</div>
```

### Breakpoints:
- Mobile (< 640px): 1 column
- Tablet (≥ 640px): 2 columns
- Desktop (≥ 1024px): 3 columns

## 8. Migration Script

Database migration to add the new field:

```sql
-- Create backup (optional)
CREATE TABLE IF NOT EXISTS memorials_backup AS TABLE memorials;

-- Add the new column
ALTER TABLE "memorials" 
ADD COLUMN "popular_name" varchar(255);

-- Populate existing historical memorials with popular names
UPDATE "memorials" 
SET "popular_name" = 'Chico Science' 
WHERE "full_name" LIKE 'Francisco de Assis França%' AND "is_historical" = true;
```

## 9. TypeScript Types

The Memorial type automatically includes the new field:

```typescript
type Memorial = {
  id: number;
  slug: string;
  fullName: string;
  popularName: string | null;  // ← NEW FIELD
  birthDate: string | null;
  deathDate: string | null;
  birthplace: string | null;
  biography: string | null;
  mainPhoto: string | null;
  isHistorical: boolean;
  // ... other fields ...
}
```

## 10. Integration Points

### Components Using These Changes:
1. **Historic Memorials Page** → Uses getDisplayName()
2. **Memorial Cards** → Shows popular name prominently
3. **Search Function** → Filters by popular name
4. **Database Queries** → Returns popularName field

### Data Flow:
```
User Input (Search)
    ↓
filteredMemorials Filter (checks popularName)
    ↓
Card Component
    ↓
getDisplayName() (formats display)
    ↓
User sees: "Chico Science • Francisco de Assis França"
```

---

**All implementations are production-ready and follow best practices for React, TypeScript, and Tailwind CSS.**
