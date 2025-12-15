# EduGrade Design System - Quick Reference

## Color Palette

### Primary Colors
```css
zinc-900: #18181b  /* Primary buttons, text, selected states */
zinc-800: #27272a  /* Gradient ends, hover states */
zinc-700: #3f3f46  /* Secondary elements */
```

### Secondary Colors
```css
zinc-600: #52525b  /* Tertiary text */
zinc-500: #71717a  /* Muted text, labels */
zinc-400: #a1a1aa  /* Disabled text, placeholders */
```

### Background Colors
```css
zinc-300: #d4d4d8  /* Subtle elements */
zinc-200: #e4e4e7  /* Borders, dividers */
zinc-100: #f4f4f5  /* Light backgrounds */
zinc-50:  #fafafa  /* Very light backgrounds */
white:    #ffffff  /* Main background */
```

## Typography

### Headings
```jsx
// Page Title
<h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent">

// Section Title
<h2 className="text-2xl font-bold text-zinc-900">

// Card Title
<h3 className="text-lg font-bold text-zinc-900">

// Label
<label className="text-sm font-semibold text-zinc-700">
```

### Body Text
```jsx
// Primary
<p className="text-base text-zinc-900">

// Secondary
<p className="text-base text-zinc-600">

// Muted
<p className="text-sm text-zinc-500">

// Small
<p className="text-xs text-zinc-400">
```

## Spacing

### Padding
```jsx
p-5   // Form fields, cards (20px)
p-6   // Large cards (24px)
px-8  // Buttons (32px horizontal)
py-3  // Buttons (12px vertical)
```

### Gaps
```jsx
gap-2   // Tight spacing (8px)
gap-3   // Standard spacing (12px)
gap-4   // Medium spacing (16px)
gap-6   // Large spacing (24px)
```

### Margins
```jsx
mb-2   // Small bottom margin (8px)
mb-4   // Medium bottom margin (16px)
mb-6   // Large bottom margin (24px)
mb-8   // Extra large (32px)
```

## Border Radius

```jsx
rounded-lg   // Standard (8px)
rounded-xl   // Enhanced (12px)
rounded-2xl  // Large (16px)
rounded-3xl  // Extra large (24px)
rounded-full // Circular
```

## Shadows

```jsx
shadow-sm   // Subtle (0 1px 2px)
shadow-md   // Medium (0 4px 6px)
shadow-lg   // Large (0 10px 15px)
shadow-xl   // Extra large (0 20px 25px)
```

## Borders

```jsx
border       // 1px solid
border-2     // 2px solid (enhanced)
border-zinc-200  // Light border
border-zinc-400  // Darker border
border-dashed    // Dashed style
```

## Buttons

### Primary Button
```jsx
<button className="
  px-8 py-3.5 
  rounded-xl 
  font-semibold 
  bg-gradient-to-r from-zinc-900 to-zinc-800 
  text-white 
  shadow-lg 
  hover:shadow-xl 
  hover:scale-105 
  transition-all duration-300
">
  Button Text
</button>
```

### Secondary Button
```jsx
<button className="
  px-6 py-3 
  rounded-lg 
  font-semibold 
  bg-zinc-100 
  text-zinc-900 
  border-2 border-zinc-200 
  hover:bg-zinc-200 
  hover:shadow-md 
  transition-all
">
  Button Text
</button>
```

### Ghost Button
```jsx
<button className="
  px-4 py-2 
  rounded-lg 
  font-medium 
  text-zinc-600 
  hover:text-zinc-900 
  hover:bg-zinc-50 
  transition-all
">
  Button Text
</button>
```

## Form Fields

### Text Input
```jsx
<input className="
  w-full 
  bg-white 
  border-2 border-zinc-200 
  rounded-xl 
  p-5 
  text-xl 
  font-medium 
  focus:outline-none 
  focus:ring-4 focus:ring-zinc-900/10 
  focus:border-zinc-900 
  transition-all 
  placeholder:text-zinc-300 
  shadow-sm
" />
```

### Textarea
```jsx
<textarea className="
  w-full 
  h-56 
  bg-white 
  border-2 border-zinc-200 
  rounded-xl 
  p-5 
  text-base 
  focus:outline-none 
  focus:ring-4 focus:ring-zinc-900/10 
  focus:border-zinc-900 
  transition-all 
  resize-none 
  placeholder:text-zinc-300 
  leading-relaxed 
  shadow-sm
" />
```

### Select
```jsx
<select className="
  w-full 
  bg-white 
  border-2 border-zinc-200 
  rounded-xl 
  p-3 
  text-base 
  focus:outline-none 
  focus:ring-4 focus:ring-zinc-900/10 
  focus:border-zinc-900 
  transition-all
">
```

## Cards

### Standard Card
```jsx
<div className="
  bg-white 
  rounded-xl 
  border-2 border-zinc-200 
  p-6 
  shadow-sm 
  hover:shadow-xl 
  hover:border-zinc-400 
  transition-all duration-300
">
```

### Selection Card (Inactive)
```jsx
<div className="
  cursor-pointer 
  p-6 
  rounded-xl 
  border-2 border-zinc-200 
  bg-white 
  text-zinc-900 
  hover:border-zinc-400 
  hover:shadow-lg 
  hover:scale-105 
  transition-all duration-300
">
```

### Selection Card (Active)
```jsx
<div className="
  cursor-pointer 
  p-6 
  rounded-xl 
  border-2 border-zinc-900 
  bg-gradient-to-br from-zinc-900 to-zinc-800 
  text-white 
  shadow-xl 
  scale-105 
  transition-all duration-300
">
```

## Gradients

### Background Gradients
```jsx
// Page background
bg-gradient-to-br from-white via-zinc-50/30 to-white

// Button gradient
bg-gradient-to-r from-zinc-900 to-zinc-800

// Card gradient (selected)
bg-gradient-to-br from-zinc-900 to-zinc-800

// Tab container
bg-gradient-to-br from-zinc-50 to-zinc-100/50
```

### Text Gradients
```jsx
// Title gradient
bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent
```

## Animations

### Transitions
```jsx
transition-all           // All properties
transition-colors        // Colors only
transition-transform     // Transforms only
transition-shadow        // Shadows only

duration-200            // 200ms (fast)
duration-300            // 300ms (standard)
duration-500            // 500ms (smooth)
```

### Transforms
```jsx
hover:scale-105         // Slight scale up
hover:scale-110         // More scale
hover:-translate-y-1    // Lift up
hover:translate-x-1     // Move right
hover:-translate-x-1    // Move left
```

### Entrance Animations
```jsx
animate-in fade-in slide-in-from-bottom-4 duration-500
animate-in fade-in slide-in-from-right-8 duration-500
```

## Icons

### Icon Sizes
```jsx
w-3 h-3    // 12px (very small)
w-4 h-4    // 16px (small)
w-5 h-5    // 20px (medium)
w-6 h-6    // 24px (large)
w-8 h-8    // 32px (extra large)
w-10 h-10  // 40px (huge)
```

### Icon Containers
```jsx
// Standard
<div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">

// With gradient
<div className="w-12 h-12 bg-gradient-to-br from-zinc-100 to-zinc-50 rounded-xl flex items-center justify-center shadow-sm">

// Selected state
<div className="w-12 h-12 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl flex items-center justify-center text-white shadow-sm">
```

## Badges

### Standard Badge
```jsx
<span className="
  px-2 py-1 
  bg-zinc-100 
  text-zinc-700 
  text-xs 
  font-semibold 
  rounded-md
">
  Badge Text
</span>
```

### Active Badge
```jsx
<span className="
  px-2 py-1 
  bg-zinc-900 
  text-white 
  text-xs 
  font-semibold 
  rounded-md
">
  Badge Text
</span>
```

## Empty States

```jsx
<div className="
  relative 
  border-2 border-dashed border-zinc-200 
  rounded-3xl 
  p-16 
  text-center 
  bg-gradient-to-br from-white via-zinc-50/30 to-white 
  overflow-hidden
">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.05),rgba(255,255,255,0))]"></div>
  <div className="relative">
    {/* Content */}
  </div>
</div>
```

## Progress Indicators

### Circular Step
```jsx
// Active
<div className="
  w-10 h-10 
  rounded-full 
  flex items-center justify-center 
  font-bold text-sm 
  bg-zinc-900 text-white 
  shadow-lg scale-110 
  transition-all duration-300
">

// Completed
<div className="
  w-10 h-10 
  rounded-full 
  flex items-center justify-center 
  font-bold text-sm 
  bg-zinc-900 text-white 
  transition-all duration-300
">
  <CheckCircle className="w-5 h-5" />
</div>

// Inactive
<div className="
  w-10 h-10 
  rounded-full 
  flex items-center justify-center 
  font-bold text-sm 
  bg-zinc-100 text-zinc-400 
  transition-all duration-300
">
```

### Progress Bar
```jsx
<div className="absolute top-5 left-0 right-0 h-0.5 bg-zinc-100 -z-10">
  <div 
    className="h-full bg-zinc-900 transition-all duration-500 ease-out"
    style={{ width: `${progress}%` }}
  />
</div>
```

## Responsive Breakpoints

```jsx
sm:   // 640px
md:   // 768px
lg:   // 1024px
xl:   // 1280px
2xl:  // 1536px
```

## Common Patterns

### Hover Lift Effect
```jsx
className="
  transform 
  hover:-translate-y-1 
  hover:shadow-xl 
  transition-all duration-300
"
```

### Icon with Animation
```jsx
<ChevronRight className="
  w-4 h-4 
  group-hover:translate-x-1 
  transition-transform
" />
```

### Focus Ring
```jsx
focus:outline-none 
focus:ring-4 
focus:ring-zinc-900/10 
focus:border-zinc-900
```

### Disabled State
```jsx
disabled:opacity-60 
disabled:cursor-not-allowed
```
