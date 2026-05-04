# Planta — Claude Code Context

## Project

**Planta** — iOS/Android plant care app with AI features.
Built with React Native + Expo SDK 54.

**User profile**: Designer/Product owner building with Claude Code. Not a developer.
Keep explanations minimal and action-focused. Propose before implementing anything large.

**Figma file key**: `CyrIdEv7UTKwSKfZGlJ2OJ`
**GitHub**: github.com/fadel2603/app-plante

---

## Tech Stack

- React Native 0.81.5 + Expo SDK 54
- expo-router (file-based navigation)
- TypeScript (strict)
- Node.js v24
- Figma MCP connected (read only via `mcp__figma-desktop__*` tools)
- Anthropic API: `claude-sonnet-4-20250514` via direct fetch (not SDK)

Key packages: `expo-blur`, `expo-linear-gradient`, `expo-image-picker`, `expo-camera`, `@expo-google-fonts/*`, `react-native-safe-area-context`

---

## Design System

### Fonts

| Token | Family | Weight | Used for |
|---|---|---|---|
| `titleDisplay` | Gasoek One | 400 | Screen titles ("Tâches du jour") |
| `headerBold` | Gabarito | 700 | Date headers, plant name headings |
| `labelMedium` | Gabarito | 500 | Section labels, badge text |
| `nameSemiBold` | Gabarito | 600 | Plant names, task names |
| `calendarMedium` | Urbanist | 500 | Day names in calendar |
| `calendarBold` | Urbanist | 700 | Day numbers in calendar |
| `bodyRegular` | Urbanist | 400 | Secondary text, species italic |

Import always from `@/constants/fonts` (`FontFamily`) and `@/constants/colors` (`Colors`).

### Colors

```
Primary green:    #B5F15B   (buttons, active states, calendar dot)
Primary dark:     #8DC93A
Dark text:        #123601   (main text)
Secondary text:   #233527
Muted text:       #666666   (italic species)
Orange badge bg:  #F8EACF
Orange badge txt: #EB7C05
Background:       #F5F7F0
Section blocks:   #E8EDE4
Card bg:          #FFFFFF
Border:           #EEEEEE
Check done bg:    #DBFFA5
Water icon bg:    #ACE2F2
Observe icon bg:  #E0ACF2
```

### iOS 26 Liquid Glass pattern

**Critical**: shadow and `overflow:hidden` cannot coexist on the same node — iOS clips shadow.

```tsx
// Outer: shadow only, NO overflow
<View style={{ shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.12, shadowRadius:18 }}>
  // Inner: clips BlurView, NO shadow
  <View style={{ borderRadius: r, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.70)' }}>
    <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />
    <View style={{ ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,255,255,0.18)' }} />
    {children}
  </View>
</View>
```

Use `tint="regular"` for full bottom sheets (system material), `tint="light"` for buttons/pills.
See `GlassButton.tsx` and `AddPlantSheet.tsx` for reference implementations.

---

## App Structure

### Screens

| File | Screen | Status |
|---|---|---|
| `app/(tabs)/index.tsx` | Accueil — daily tasks + calendar strip | ✅ Complete |
| `app/(tabs)/plants.tsx` | Mes Plantes — plant grid | ✅ Complete |
| `app/(tabs)/scanner.tsx` | Scanner — tab placeholder | 🚧 Stub |
| `app/plant/[id].tsx` | Détail plante — care info + timeline | ✅ Complete |
| `app/add-plant/camera.tsx` | Caméra — photo capture | ✅ Complete |
| `app/add-plant/analyzing.tsx` | Analyse IA — loading animation | ✅ Complete |
| `app/add-plant/result.tsx` | Résultat identification IA | ✅ Complete |
| `app/scan-result.tsx` | Résultat scan rapide | ✅ Complete |
| `app/recommendation.tsx` | Recommandations IA — care plan steps | ✅ Complete |

### Navigation

Tab bar (3 tabs): Accueil · Mes Plantes · Scanner
Custom tab bar: `LiquidGlassTabBar.tsx` (iOS 26 Liquid Glass pill)

### Constants

| File | Contents |
|---|---|
| `constants/colors.ts` | `Colors` object — all design tokens |
| `constants/fonts.ts` | `FontFamily` object — all font tokens |
| `constants/data.ts` | `Plant` + `Task` types, mock `PLANTS` + `TASKS` arrays |
| `constants/api.ts` | `ANTHROPIC_API_KEY`, `AI_MODEL`, `SYSTEM_PROMPT` |

---

## Components

### Orchestrators

| File | Description |
|---|---|
| `components/AISheet.tsx` | AI chat modal — full bottom sheet, multi-turn, vision |
| `components/AddPlantSheet.tsx` | iOS 26 bottom sheet — camera/gallery options |
| `components/AddPlantFormSheet.tsx` | Plant form bottom sheet after identification |
| `components/PlantPreviewSheet.tsx` | Plant preview bottom sheet from home card |
| `components/LiquidGlassTabBar.tsx` | Custom tab bar (iOS 26 Liquid Glass pill) |
| `components/CalendarStrip.tsx` | Horizontal calendar strip |
| `components/TaskItem.tsx` | Individual task row (checkbox + plant + action) |

### AI sub-components (`components/ai/`)

| File | Description |
|---|---|
| `AIHero.tsx` | Hero animation shown when chat is empty |
| `ChatBubble.tsx` | Message bubble (user/AI), image preview, `TypingDots` |
| `ChatInput.tsx` | Input pill — camera icon + text field + send button |

### UI primitives (`components/ui/`)

| File | Props summary | Variants |
|---|---|---|
| `Badge.tsx` | `label`, `icon?`, `variant` | success / warning / neutral / count |
| `Button.tsx` | `label`, `icon?`, `variant`, `onPress` | primary (#B5F15B) / secondary |
| `Card.tsx` | `children`, `style?` | — |
| `GlassButton.tsx` | `size?`, `onPress`, `children` | circular iOS glass |
| `IconCircle.tsx` | `icon`, `size?`, `bg` | sm 22 / md 34 / lg 44 |
| `PlantCard.tsx` | `plant`, `onPress`, `onFavPress?` | — |
| `ProgressBar.tsx` | `value` (0–1), `style?` | — |
| `ScreenHeader.tsx` | `title`, `subtitle?`, `action?` | — |
| `StepCard.tsx` | `step`, `icon`, `title`, `description` | — |
| `TaskGroup.tsx` | `title`, `tasks`, `onToggle` | — |
| `TimelineItem.tsx` | `icon`, `action`, `date`, `isLast?` | — |

---

## AI Features

### 1. General AI Assistant — `AISheet.tsx` ✅ Live
- Model: `claude-sonnet-4-20250514`
- Multi-turn conversation with history
- Vision support (camera + gallery)
- System prompt: "You are Planta, an expert AI assistant specialized in plant care…"
- Accessed from home screen via sparkle button

### 2. Auto plant care planning 🚧 Todo
Goal: after plant identification, generate a personalized weekly care schedule.

### 3. Contextual plant assistant 🚧 Todo
Goal: on plant detail screen, AI answers questions specifically about that plant.

---

## Rules — Never Break These

### API Keys
- **Never hardcode API keys** anywhere in source files.
- Always use `EXPO_PUBLIC_ANTHROPIC_API_KEY` from `.env`.
- Access via `import { ANTHROPIC_API_KEY } from '@/constants/api'`.
- `.env` is gitignored. `.env.example` (no real keys) is committed.
- EXPO_PUBLIC_* vars are bundled in the JS binary — not server secrets. Production needs a backend proxy.

### Design
- **Never change design or styling** when adding a new feature unless explicitly asked.
- **Never break existing screens** — always check impact before refactoring.
- Run `npx tsc --noEmit` after every change. Zero errors required.
- Apple HIG: minimum **44×44pt** touch target on every interactive element.
- iOS 26 Liquid Glass: always use the shadow/overflow split pattern (see above).

### Code
- No hardcoded colors or font names — use `Colors` and `FontFamily` from constants.
- No comments explaining what code does — only add a comment for a non-obvious constraint or workaround.
- No extra abstractions beyond what the task requires.

### UI work
- For any UI/UX or layout work, load and follow the `ios-hig-design` and `mobile-ios-design` skills.
- Test on iOS simulator before marking UI work complete.

---

## Commands

```bash
# Start dev server
npx expo start

# TypeScript check (must pass before any commit)
npx tsc --noEmit

# Launch Claude Code in project
cd ~/app-plante && claude

# Push to GitHub
/commit-push-pr
```

---

## Figma

- File key: `CyrIdEv7UTKwSKfZGlJ2OJ`
- Page with Claude-built screens: node `404:3961` ("Ecran fait par claude")
- MCP tools: `mcp__figma-desktop__*` (read only from desktop app)
- Plugin MCP tools: `mcp__plugin_figma_figma__*` (read/write via plugin)
- When creating Figma components, always set `layoutSizingHorizontal = 'FILL'` **after** `parent.appendChild(child)` — never before.
