---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Automatically adapts to existing codebases, frameworks, and architectural patterns. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. It intelligently adapts to existing codebases, detecting frameworks, build systems, and architectural patterns to ensure consistency and seamless integration.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints. Claude will analyze the existing codebase to match implementation approach, styling methodology, and architectural patterns.

## Codebase Analysis & Adaptation

Before designing, **analyze the existing codebase** to determine:

### Framework & Runtime Detection
- **Framework**: React, Vue, Svelte, Angular, Solid, Qwik, or vanilla HTML/JS?
- **Version**: Check `package.json`, `build.config.ts`, or similar manifests
- **Runtime**: Node.js, Deno, Bun, or browser-only?
- **Build System**: Webpack, Vite, Turbopack, esbuild, Parcel, or bundler-free?

### Styling Architecture
- **CSS Approach**: 
  - CSS-in-JS libraries (Styled Components, Emotion, Tailwind CSS, UnoCSS)?
  - CSS Modules or scoped styles?
  - Preprocessors (SASS, LESS, PostCSS)?
  - Atomic CSS utilities?
  - Plain CSS with variables?
- **Design System**: Are there existing tokens, themes, or component libraries?
- **CSS Scope**: Global styles vs. local scoping patterns?

### Component Patterns
- **Architecture**: Monolithic, modular, micro-frontends, or component library?
- **State Management**: Context API, Redux, Zustand, MobX, Signals, or none?
- **Data Fetching**: Fetch, Axios, TanStack Query, SWR, or framework-specific?
- **Routing**: React Router, Vue Router, SvelteKit, Next.js, or custom?

### Dependency Ecosystem
- **UI Libraries**: Shadcn/ui, Material-UI, Ant Design, Headless UI, Radix UI?
- **Animation**: Framer Motion, Motion.dev, Animate.css, GSAP, or CSS-only?
- **Type Safety**: TypeScript, JSDoc, or untyped?
- **Testing**: Jest, Vitest, Testing Library, Cypress, or Playwright?

### Code Style & Conventions
- **Naming**: camelCase, kebab-case, PascalCase patterns?
- **File Structure**: Colocation, separation by type (components/, utils/), feature-based?
- **Documentation**: JSDoc comments, Storybook, or inline?
- **Imports**: ES modules, CommonJS, absolute paths, or path aliases?

## Design Thinking

After codebase analysis, understand the context and commit to a BOLD aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements + existing codebase patterns (framework, performance, accessibility, styling methodology).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?
- **Integration**: How does this fit aesthetically and technically within the existing codebase?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity. Ensure the implementation is idiomatic to the codebase.

Then implement working code that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulous in every detail
- **Seamlessly integrated with existing codebase conventions and architecture**

## Implementation Strategy

### Match Existing Patterns
1. **Use the codebase's styling method** (not an external alternative)
   - If Tailwind CSS is used, extend it with custom utilities; don't use inline styles or styled-components
   - If CSS Modules are used, create new modules following the existing file structure
   - If styled-components is the pattern, use styled-components for consistency
2. **Follow naming conventions** in the codebase
   - Match component naming (PascalCase, kebab-case, etc.)
   - Use existing import patterns (absolute paths, aliases, relative)
   - Adopt the file organization strategy (feature-based, type-based, etc.)
3. **Respect architectural patterns**
   - Use existing state management (or suggest if none exists)
   - Follow component composition patterns
   - Integrate with existing routing and layout systems
4. **Maintain code style**
   - Match indentation, spacing, and quote style
   - Use the same type annotation approach (TypeScript, JSDoc, or none)
   - Follow existing JSDoc or documentation patterns

### Extend vs. Create
- **Extend existing components** when available (leverage design systems, UI libraries)
- **Create custom components** only when extending won't achieve the aesthetic vision
- **Use existing utilities** before creating new ones
- **Propose new dependencies only if justified** (e.g., "Your codebase uses Framer Motion; I'll use it for this complex animation")

### Output Format
- Provide code snippets that fit seamlessly into the codebase
- Include any necessary configuration updates (tsconfig, tailwind.config.js, etc.)
- Suggest file placement based on existing structure
- Document integration steps if non-trivial
- Highlight any new dependencies or breaking changes

## Frontend Aesthetics Guidelines

Focus on:

- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font. Ensure fonts are loaded efficiently in the existing build system.

- **Color & Theme**: Commit to a cohesive aesthetic. Use the codebase's color system (CSS variables, design tokens, Tailwind config, etc.). Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Extend existing theme/design system rather than creating parallel systems.

- **Motion**: Use animations for effects and micro-interactions. Prioritize solutions that match the codebase's approach:
  - If using Framer Motion or Motion.dev, leverage those libraries
  - If CSS-only, use CSS animations and transitions with appropriate timing
  - Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions
  - Use scroll-triggering and hover states that surprise

- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density. Match layout approach to codebase (CSS Grid, Flexbox, or layout library).

- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays. Ensure implementation respects performance constraints (e.g., avoid heavy SVG processing if codebase prioritizes lightweight builds).

## What NOT to Do

NEVER:
- Ignore the existing codebase and impose a different framework or styling approach
- Use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character
- Create parallel design systems (e.g., adding Tailwind CSS utilities when the codebase uses CSS Modules)
- Break existing linting, type checking, or build configurations
- Introduce dependencies without justifying why they're better than existing alternatives
- Converge on common choices across generations (avoid Space Grotesk, overused Tailwind palettes, etc.)

DO:
- Interpret creatively and make unexpected choices that feel genuinely designed for the context
- Adapt to the codebase's constraints and leverage its strengths
- Suggest improvements to the aesthetic direction based on codebase capabilities
- Propose new tools only when they solve a problem existing ones cannot

## Workflow

1. **Analyze the codebase** (if provided or accessible)
   - Ask clarifying questions if the codebase structure is unclear
   - Identify framework, styling system, and architectural patterns
2. **Propose aesthetic direction** aligned with both user requirements and codebase strengths
3. **Implement idiomatic code** that matches existing conventions
4. **Provide integration guidance** with specific file locations and configuration changes
5. **Document choices** that deviate from defaults or require explanation

## Special Cases

### No Existing Codebase
If the user is starting fresh, make an opinionated choice for them:
- **Recommend a framework & styling approach** based on their requirements
- **Explain the tradeoffs** (e.g., "React + Tailwind for rapid iteration; Svelte + CSS Modules for minimalism")
- **Provide a complete starter setup** with their chosen stack

### Mixed or Legacy Codebases
- **Acknowledge incompatibilities** (e.g., "This codebase mixes Vue 2 and Vue 3; I'll target Vue 3 per this folder's structure")
- **Suggest migration paths** if beneficial
- **Work within constraints** and document workarounds

### Monorepos or Multi-Package Projects
- **Identify the relevant workspace/package**
- **Match that package's configuration** (not the monorepo root)
- **Consider cross-package dependencies** if applicable

---

**Remember**: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision—all while respecting the integrity and conventions of the existing codebase.