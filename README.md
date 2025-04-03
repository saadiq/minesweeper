Here's a detailed specification for your Minesweeper game:

# Minesweeper Game Specification

## Overview
A modern, web-based implementation of the classic Minesweeper game with vibrant visuals and standard gameplay mechanics. The game supports both desktop and mobile devices with intuitive touch controls.

## Visual Design
- **Color Scheme**: Vibrant colors with purple cells, gradient backgrounds, and colorful numbered indicators
- **Interface**: Clean, centered layout with responsive design
- **Typography**: Bold, easy-to-read text with a gradient title effect
- **Animations**: Subtle hover and click animations for better user feedback
- **Theme Support**: Light and dark mode with system preference detection
- **Visual Feedback**: Page-wide flash effect when flagging cells

## Game Components
1. **Header**
   - Game title with gradient effect
   - Difficulty selection buttons (Easy, Medium, Hard)
   - New Game button
   - Status display (game state indicator)

2. **Game Info Panel**
   - Mine counter (remaining mines)
   - Timer display (minutes:seconds format)

3. **Game Board**
   - Grid of cells based on difficulty setting
   - Visual indicators for revealed, flagged, and mine cells
   - Responsive sizing for different screen sizes

4. **Controls**
   - Flag mode toggle button
   - Theme toggle in bottom-left corner
   - Instructions panel

5. **Instructions**
   - Mobile controls: Tap to reveal, hold to flag
   - Desktop controls: Click to reveal, right-click to flag
   - Game mechanics explanation

## Game Mechanics

### Difficulty Levels
- **Easy**: 10×10 grid with 15 mines
- **Medium**: 16×16 grid with 40 mines
- **Hard**: 16×30 grid with 99 mines

### Gameplay Rules
1. **Initialization**
   - Game board is created with randomly placed mines
   - Timer starts only after the first player action (click or flag)
   - Game state begins in "waiting" mode

2. **Cell Interaction**
   - Desktop:
     - Left-click: Reveal a cell
     - Right-click: Toggle a flag on/off on unrevealed cells
   - Mobile:
     - Tap: Reveal a cell
     - Long-press: Toggle a flag on/off on unrevealed cells
   - Flag Mode:
     - Toggle button to switch between reveal and flag modes
     - Click/tap to perform the selected action

3. **Cell States**
   - Unrevealed: Default purple background
   - Revealed: Shows either a number (1-8) or blank
   - Flagged: Shows a flag icon (🚩)
   - Mine: Shows a bomb icon (💣) when revealed

4. **Game Progression**
   - Numbers indicate the count of adjacent mines
   - Empty cells auto-reveal adjacent empty cells
   - Flagging all mines correctly ends the game with a win
   - Visual feedback when flagging cells

5. **Win/Loss Conditions**
   - Win: All mines are correctly flagged
   - Loss: Player reveals a mine

6. **Timer Behavior**
   - Starts on first player action
   - Increments in 1-second intervals
   - Stops when game ends (win or loss)

## Accessibility Features
- Clear visual indicators for important game states
- Color combinations with sufficient contrast
- Emoji icons for flags and mines
- Touch-friendly controls for mobile devices
- Visual feedback for all actions
- Theme support for light/dark mode preferences

This specification provides a comprehensive overview of your Minesweeper game, documenting its visual design, gameplay mechanics, and technical implementation details.