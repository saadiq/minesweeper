# Minesweeper Technical Specification

## Core Game State

### State Variables
```typescript
interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

interface BoardSize {
  rows: number;
  cols: number;
}

interface TouchTimer {
  timerId: NodeJS.Timeout | null;
  touchStartTime: number;
}

// Game States
type GameState = 'waiting' | 'playing' | 'won' | 'lost';
```

### Game Configuration
- **Difficulty Levels**:
  - Easy: 10×10 grid, 15 mines
  - Medium: 16×16 grid, 40 mines
  - Hard: 16×30 grid, 99 mines
- **Cell Sizes**:
  - Min: 30px × 30px
  - Max: 40px × 40px
  - Responsive: Scales based on viewport

## Game Mechanics

### Board Initialization
1. Create empty board with specified dimensions
2. Randomly place mines (ensuring no duplicates)
3. Calculate neighbor mine counts for each cell
4. Reset game state to 'waiting'

### Cell States
1. **Unrevealed**
   - Background: Purple (#9333ea)
   - Hover: Lighter purple (#a855f7)
   - Scale: 1.05 on hover
   - Border radius: 0.5rem

2. **Revealed**
   - Background: Theme-dependent (light/dark)
   - Shadow: Inset 1px 1px 3px
   - Numbers: Color-coded 1-8
   - Mine: Pink (#ec4899)

3. **Flagged**
   - Background: Green (#22c55e)
   - Icon: 🚩
   - Visual feedback: Page flash on flag

### Game Progression
1. **Start Conditions**
   - Timer starts on first action (click/flag)
   - Game state changes to 'playing'
   - Board remains in 'waiting' state until first action

2. **Cell Reveal Logic**
   - Cannot reveal flagged cells
   - Empty cells (0 neighbors) auto-reveal adjacent cells
   - Recursive reveal stops at cells with numbers
   - Mine reveal ends game with loss

3. **Flagging System**
   - Maximum flags = mine count
   - Cannot flag revealed cells
   - Visual feedback on flag placement
   - Flag count displayed in game info

4. **Win Conditions**
   - All mines correctly flagged
   - All flags placed on mines
   - Flag count equals mine count

5. **Loss Conditions**
   - Revealing any mine
   - All mines revealed on loss

## Touch Implementation

### Touch Events
1. **Short Press (< 500ms)**
   - Reveals cell if not flagged
   - Ignored if cell is flagged
   - Prevents synthetic click events

2. **Long Press (≥ 500ms)**
   - Toggles flag on unrevealed cells
   - Triggers chord reveal on revealed numbers
   - Visual feedback on flag toggle

3. **Touch Prevention**
   - Disabled text selection
   - Disabled pull-to-refresh
   - Disabled double-tap zoom
   - Touch highlight color: transparent

### Touch State Management
```typescript
// Touch state tracking
const longPressHandledRef = useRef(false);
const lastTouchTimeRef = useRef(0);
const touchTimer = useState<TouchTimer>({ 
  timerId: null, 
  touchStartTime: 0
});
```

## Theme System

### Theme Variables
```css
:root,
[data-theme="light"] {
  --background: #ffffff;
  --foreground: #171717;
  --cell-revealed-bg: #ffffff;
  --cell-revealed-shadow: rgba(0, 0, 0, 0.2);
  --instructions-bg-start: #ddd6fe;
  --instructions-bg-end: #fbcfe8;
  --instructions-text: #4c1d95;
}

[data-theme="dark"] {
  --background: #0a0a0a;
  --foreground: #ededed;
  --cell-revealed-bg: #1f2937;
  --cell-revealed-shadow: rgba(0, 0, 0, 0.4);
  --instructions-bg-start: #312e81;
  --instructions-bg-end: #831843;
  --instructions-text: #e0e7ff;
}
```

### Theme Persistence
- Stored in localStorage
- System preference detection
- Manual toggle support
- Smooth transitions

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Optimizations
1. **Layout**
   - Reduced padding and margins
   - Compact UI elements
   - Touch-friendly sizing

2. **Controls**
   - Touch-optimized gestures
   - Prevented unwanted interactions
   - Visual feedback for touch actions

3. **Theme Toggle**
   - Smaller size on mobile
   - Adjusted positioning
   - Touch-friendly hit area

## Accessibility Features

### Visual Accessibility
- High contrast color combinations
- Clear visual indicators
- Consistent color coding
- Theme support for light/dark mode

### Interaction Accessibility
- Touch-friendly targets
- Clear visual feedback
- Keyboard navigation support
- Screen reader compatibility

## Performance Considerations

### State Management
- Efficient board updates
- Memoized callbacks
- Optimized re-renders
- Cleanup on unmount

### Touch Handling
- Debounced touch events
- Efficient state updates
- Prevention of duplicate events
- Memory leak prevention

## Testing Requirements

### Unit Tests
- Board initialization
- Mine placement
- Neighbor calculation
- Game state transitions
- Win/loss conditions

### Integration Tests
- Touch interactions
- Theme switching
- Responsive behavior
- State persistence

### Visual Tests
- Color contrast
- Responsive layout
- Animation smoothness
- Theme consistency

## Future Enhancements

### Potential Features
1. **Gameplay**
   - Custom board sizes
   - Difficulty presets
   - First-click protection
   - Undo/redo system

2. **UI/UX**
   - Sound effects
   - Haptic feedback
   - Custom themes
   - Statistics tracking

3. **Technical**
   - Performance optimizations
   - Offline support
   - Multiplayer mode
   - Leaderboards 