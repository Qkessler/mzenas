# Honest Greens — UX & Design Research

Research conducted 2026-04-11 as inspiration for Linvo's Figma mock-ups.

## Brand Overview

Honest Greens is a fast-casual restaurant chain focused on "real food" — chef-driven, Mediterranean-inspired, seasonal cuisine. Their tagline is "EAT REAL." They position as premium yet accessible, with a strong health-conscious identity.

## Visual Design

### Color System
- **Primary:** Black (#000) as the dominant brand color
- **Neutrals:** Clean white backgrounds with dark text
- **Accents:** Dark blue/gray for secondary elements, functional greens and reds for status
- Overall: sophisticated, minimalist palette — dark mode supported

### Typography
- Modern, hierarchical system following Material Design principles
- Font weights: 400-500 for clean readability
- Text sizes: 12px (captions) to 24px (headers)
- Uppercase button text with 500-weight font
- Icon sizing: 24-40px standard scale

### Layout Patterns
- Card-based content containers with subtle shadows and rounded corners (3-4px radius)
- Flexbox-based responsive layouts
- Carousel/slider components with touch support
- Skeleton loading states with animation
- Consistent spacing: 8-24px padding system

## Navigation & Interaction

### Navigation Structure
- Fixed headers (50px) and footers
- Drawer navigation for mobile
- Tab-based navigation with visual indicators
- Breadcrumb support for hierarchy

### Interactive Elements
- Multiple button variants: flat, outlined, raised, push-style
- Button heights: 36-56px with 4-16px padding
- Rounded (28px), rectangular (3px), and square border radius options
- Hover states with shadow elevation changes
- Smooth 300ms transitions for visual feedback

## Technology Stack
- Built on **Quasar Framework** (Vue.js based)
- Material Design components
- Material Icons for iconography
- SVG graphics for scalability
- Internationalization: Spanish, English, Catalan, Portuguese, French
- Language auto-detection and routing

## Food & Content Presentation

### Menu Approach
- Rotating seasonal menu items with named signature dishes
- Descriptive, evocative naming: "Spicy Feta Bowl", "Pistachio Caesar Crunch"
- "Plates to share" concept
- Specialty beverages with creative names (Summer Shakers collection)
- Emphasis on handmade/artisanal preparation ("pressed, baked, finished fresh every day")
- Image-forward presentation with carousel browsing
- Badge indicators for item attributes (dietary, seasonal)

### Brand Messaging
- Quality over speed — premium positioning
- Mediterranean-inspired, seasonal focus
- Uses JOSPER Charcoal Equipment for fire-cooking — craft emphasized
- Health-conscious without being preachy

## Key UX Takeaways for Linvo

1. **Minimalist aesthetic works for food:** Clean black/white palette with selective accent color lets the food imagery do the heavy lifting. Linvo should follow the same principle — terracotta accents, but let restaurant photos be the hero.

2. **Mobile-first is non-negotiable:** Touch-optimized controls, drawer navigation, card layouts. Everything designed for one-handed phone use at a restaurant table.

3. **Material Design as foundation:** Leveraging familiar patterns (tabs, FABs, bottom sheets) reduces cognitive load. Users don't need to learn a new UI language.

4. **Image-centric food presentation:** Carousel and card-based layouts emphasize visual appeal. Every menu item should have a photo — this is what drives ordering decisions.

5. **Premium but accessible feel:** Sophisticated design without being overly complex. No unnecessary animations or decoration — every element earns its space.

6. **Seasonal and rotating content:** The design system supports frequently changing menu items. Linvo's restaurant clients will update their menus regularly — the UI must make this feel effortless.

7. **Craft-focused messaging:** Honest Greens emphasizes the "how" of food preparation. Linvo can surface this for restaurants — letting them tell their story alongside the menu.

## What We Couldn't Access
- App Store / Google Play screenshots (blocked)
- Direct ordering interface or checkout flow details
- Cart functionality specifics
- Specific emoji usage patterns in-app
- Third-party delivery platform integration details (UberEats, Deliveroo, Glovo all redirect)

## How This Informs Linvo's Design

| Honest Greens Pattern | Linvo Adaptation |
|---|---|
| Black primary color | Terracotta (#E07856) as accent on white/dark base |
| Material Design components | Same — buttons, cards, bottom sheets, FABs |
| Card-based menu browsing | Menu item cards with image, name, price, badges |
| Carousel for featured items | Chef recommendations carousel on categories screen |
| Fixed header + drawer nav | Top bar with back arrow + category pills |
| Health-focused badges | Dietary badges (V, GF) + "Hot Moment" deal badges |
| Seasonal rotation support | Easy menu management for restaurant operators |
| Premium minimalism | Clean layouts with generous whitespace, real food imagery |