# Orbital Shift - Hexagon Puzzle Game

A React-based puzzle game where you fill hexagon orbits with numbers to match target sums. Deployable on Vercel.

## Game Rules

- The game features a hexagon grid with numbered center hexagons
- Each center hexagon is surrounded by an orbit of 6 hexagons
- Fill the orbit hexagons with numbers (0-9) so their sum equals the center number
- Rotate orbits to align numbers with adjacent orbits
- Win by correctly filling all orbits!

## How to Play

1. **Select a hexagon**: Click on any orbit hexagon to select it
2. **Enter a number**: Use the number pad (0-9) to fill the selected hexagon
3. **Rotate an orbit**: Hold Shift and click any hexagon in an orbit to rotate it clockwise
4. **Clear a hexagon**: Click the "Clear" button to remove a number

## Development

### Setup

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

### Deploy to Vercel

The project is configured for Vercel deployment. Simply connect your repository to Vercel or use:

```bash
vercel
```

## Project Structure

```
src/
  components/
    Hexagon.jsx       # Individual hexagon component
    HexagonGrid.jsx   # Grid rendering component
  hooks/
    useGame.js        # Game state and logic
  utils/
    hexagon.js        # Hexagon grid utilities
  App.jsx             # Main game component
```

## Technologies

- React 19
- Vite
- SVG for hexagon rendering
- CSS for styling (Wordle/Sudoku-inspired UI)

## Customization

You can customize the game by modifying `INITIAL_CENTERS` in `src/App.jsx`:

```javascript
const INITIAL_CENTERS = [
  { q: 0, r: 0, target: 15 },  // Center at (0,0) with target sum 15
  { q: 3, r: 0, target: 20 },   // Center at (3,0) with target sum 20
];
```

The `q` and `r` values are hexagon coordinates, and `target` is the sum that the orbit should equal.
