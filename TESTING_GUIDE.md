# 🎣 Luxury Angler - Complete Testing Guide

## 🚀 Quick Start

### 1. Start the Development Server

**Option A: Using Batch File**
- Double-click `start-server.bat` in the project root
- Wait for "Local: http://localhost:5173" message

**Option B: Manual Command**
```bash
npm run dev
```

**Option C: Alternative Start**
```bash
npm start
```

### 2. Access the Game
- Open your browser
- Navigate to: **http://localhost:5173**
- The game should load automatically

---

## 🎮 Game Testing Checklist

### Basic Functionality Tests

#### ✅ Menu Navigation
- [ ] Game loads without errors
- [ ] Main menu appears with title "LUXURY ANGLER"
- [ ] All menu buttons are clickable and responsive
- [ ] Scene transitions work smoothly

#### ✅ Boat Menu Scene
- [ ] Status panel shows correct information:
  - Location: Starting Port
  - Time: Dawn
  - Weather: Sunny
  - Energy: 100/100
  - Fishtank: 0/10
  - Level: 1
  - Coins: 1000
- [ ] All action buttons are visible and functional:
  - TRAVEL (blue)
  - FISH (green, DOM button)
  - CABIN (orange)
  - QUEST (purple)
  - INVENTORY (purple)
  - SHOP (yellow)

#### ✅ Fishing System
- [ ] Click green "FISH" button to start fishing
- [ ] Fishing scene loads successfully
- [ ] QTE (Quick Time Events) system activates
- [ ] Fish AI behavior is visible
- [ ] Can catch fish and return to boat menu

---

## 🔧 Debug Features Testing

### Keyboard Shortcuts
Test each of these shortcuts in the boat menu:

- [ ] **F5** - Reset fish inventory (adds 5 trout cards)
  - Message: "Fish inventory reset! 5 trout cards added."
  
- [ ] **F6** - Debug current fish inventory
  - Check console for detailed inventory output
  
- [ ] **F7** - Add 50,000 coins for testing
  - Message: "Added 50,000 coins! Total: [new amount]"
  - Coins display updates immediately
  
- [ ] **F8** - Set player level to 15
  - Message: "Player level set to 15!"
  - Level display updates immediately
  
- [ ] **ESC** - Return to main menu
  - Should transition back to main menu

### QTE Debug Tool Testing

#### Opening the Debug Tool
- [ ] Start fishing (click green FISH button)
- [ ] Press **F12** or **Ctrl+Shift+Q** during fishing
- [ ] QTE Debug Tool overlay appears

#### Debug Tool Components
- [ ] **Control Panel** visible with:
  - Start Debug Session button
  - Stop Debug Session button
  - Reset Statistics button
  - Export Data button
  - Difficulty slider (1-10)
  - Auto-Test toggle

- [ ] **Statistics Panel** shows:
  - Total QTE Attempts
  - Successful QTEs
  - Failed QTEs
  - Success Rate percentage
  - Average Reaction Time

- [ ] **QTE Test Panel** has buttons for all 10 QTE types:
  - DASH
  - THRASH
  - DIVE
  - SURFACE
  - CIRCLE
  - JUMP
  - ROLL
  - SHAKE
  - PULL
  - SPIRAL

- [ ] **Struggle Test Panel** has buttons for all 10 struggle types:
  - DASH
  - THRASH
  - DIVE
  - SURFACE
  - CIRCLE
  - JUMP
  - ROLL
  - SHAKE
  - PULL
  - SPIRAL

---

## 📊 QTE Control Schemes Testing

Test each QTE type individually using the debug tool:

### 1. DASH - Rapid Tap
- [ ] Trigger: Click "Test DASH" in debug tool
- [ ] Control: Rapidly tap SPACEBAR multiple times
- [ ] Expected: Fast tapping required, progress bar fills with each tap
- [ ] Success: Complete within time limit

### 2. THRASH - Hold & Release
- [ ] Trigger: Click "Test THRASH" in debug tool
- [ ] Control: Hold SPACEBAR for 1.5 seconds, then release
- [ ] Expected: Hold indicator shows progress, release at right time
- [ ] Success: Release when indicator reaches target zone

### 3. DIVE - Timing Window
- [ ] Trigger: Click "Test DIVE" in debug tool
- [ ] Control: Hit SPACEBAR when indicator enters green zone
- [ ] Expected: Moving indicator with green target zone
- [ ] Success: Hit spacebar precisely when in green zone

### 4. SURFACE - Directional Sequence
- [ ] Trigger: Click "Test SURFACE" in debug tool
- [ ] Control: Press WASD keys in displayed order
- [ ] Expected: Sequence of directional arrows shown
- [ ] Success: Press all keys in correct order within time limit

### 5. CIRCLE - Rotation Hold
- [ ] Trigger: Click "Test CIRCLE" in debug tool
- [ ] Control: Hold SPACEBAR during circular motion
- [ ] Expected: Circular progress indicator
- [ ] Success: Hold spacebar for full rotation

### 6. JUMP - Precision Timing
- [ ] Trigger: Click "Test JUMP" in debug tool
- [ ] Control: Hit SPACEBAR at exact breach moment
- [ ] Expected: Fish jumping animation with precise timing window
- [ ] Success: Hit spacebar at peak of jump

### 7. ROLL - Alternating Tap
- [ ] Trigger: Click "Test ROLL" in debug tool
- [ ] Control: Alternate A and D keys rapidly
- [ ] Expected: Left/right indicators alternating
- [ ] Success: Keep up with alternating pattern

### 8. SHAKE - Rhythm Tap
- [ ] Trigger: Click "Test SHAKE" in debug tool
- [ ] Control: Tap SPACEBAR in rhythm with beats
- [ ] Expected: Rhythm indicators with beat timing
- [ ] Success: Match the rhythm pattern

### 9. PULL - Power Hold
- [ ] Trigger: Click "Test PULL" in debug tool
- [ ] Control: Hold SPACEBAR for 2-3 seconds
- [ ] Expected: Power meter fills gradually
- [ ] Success: Hold until power meter is full

### 10. SPIRAL - Complex Sequence
- [ ] Trigger: Click "Test SPIRAL" in debug tool
- [ ] Control: WASD sequence + SPACEBAR timing combo
- [ ] Expected: Complex multi-step sequence
- [ ] Success: Complete all steps in correct order

---

## 🐟 Fish AI Behavior Testing

### Swimming State Observation
Watch fish behavior during fishing sessions:

- [ ] **IDLE (30%)** - Fish stays relatively still
- [ ] **PATROL (40%)** - Fish moves in patterns around the area
- [ ] **FEEDING (20%)** - Fish actively seeks and approaches bait
- [ ] **FLEEING (10%)** - Fish tries to escape when hooked

### Struggle Pattern Testing
Use the debug tool to test different struggle patterns:

- [ ] **Burst Patterns** - Sudden intensity spikes
- [ ] **Gradual Patterns** - Smooth intensity changes
- [ ] **Oscillating Patterns** - Regular up/down cycles
- [ ] **Chaotic Patterns** - Unpredictable variations

### Environmental Effects
Test how environment affects fish behavior:

- [ ] Time of day changes (Dawn, Morning, Noon, Evening, Night)
- [ ] Weather changes (Sunny, Cloudy, Rainy, Stormy)
- [ ] Location changes (different fishing areas)

---

## 🎯 Advanced Testing

### Auto-Test Mode
- [ ] Enable Auto-Test in debug tool
- [ ] Observe continuous QTE testing
- [ ] Check statistics accumulation
- [ ] Verify all QTE types are tested

### Export Functionality
- [ ] Run several QTE tests
- [ ] Click "Export Data" button
- [ ] Verify CSV/JSON data export
- [ ] Check data includes all statistics

### Performance Testing
- [ ] Monitor frame rate during gameplay
- [ ] Check for memory leaks during extended play
- [ ] Test QTE responsiveness and timing accuracy
- [ ] Verify audio plays correctly
- [ ] Check visual effects render properly

---

## 🚨 Troubleshooting

### Common Issues

**Server Won't Start:**
- Check if Node.js is installed: `node --version`
- Check if npm is installed: `npm --version`
- Try: `npm install` to reinstall dependencies
- Try: `npm run build` then `npm run preview`

**Game Won't Load:**
- Check browser console for errors (F12)
- Try different browser (Chrome, Firefox, Edge)
- Clear browser cache and reload
- Check if port 5173 is blocked by firewall

**QTE Debug Tool Won't Open:**
- Make sure you're in fishing mode first
- Try both F12 and Ctrl+Shift+Q
- Check browser console for JavaScript errors
- Refresh page and try again

**QTEs Not Responding:**
- Check keyboard focus is on game window
- Try clicking on game area first
- Check if keys are working in other applications
- Try different keys if some don't work

### Debug Console Commands
Open browser console (F12) and try these:

```javascript
// Check game state
console.log(window.game);

// Check current scene
console.log(window.game.scene.getScene('GameScene'));

// Force open debug tool
window.game.scene.getScene('GameScene').qteDebugTool.show();
```

---

## ✅ Success Criteria

The game passes testing if:

- [ ] All 10 QTE types work correctly
- [ ] Debug tool opens and functions properly
- [ ] Statistics tracking works accurately
- [ ] Fish AI shows varied behavior patterns
- [ ] All keyboard shortcuts function
- [ ] Export functionality works
- [ ] No critical errors in console
- [ ] Smooth 60 FPS performance
- [ ] Audio and visuals work correctly

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________
OS: ___________

Basic Functionality: ✅ / ❌
QTE System: ✅ / ❌
Debug Tool: ✅ / ❌
Fish AI: ✅ / ❌
Performance: ✅ / ❌

Notes:
_________________________________
_________________________________
_________________________________
```

Happy testing! 🎣 