# Luxury Angler - Phaser 3 Fishing Game

A premium fishing simulation game built with Phaser 3, featuring comprehensive gameplay systems, data-driven design, and modern web technologies.

## 🎮 Game Features

### Core Gameplay
- **Three-Phase Fishing System**: Cast → Lure → Reel mechanics
- **Equipment System**: Rods, lures, and boats with different stats
- **Fish Collection**: Diverse fish species with rarity and value systems
- **Progression System**: Level up, gain experience, and unlock new content
- **Inventory Management**: Comprehensive item storage and organization
- **Crafting System**: Create and upgrade fishing equipment

### Game Modes
- **Story Mode**: Structured progression with objectives
- **Practice Mode**: Free fishing without restrictions
- **Multiple Locations**: Various fishing spots with unique fish populations

### Technical Features
- **Data-Driven Design**: JSON-based configuration for easy content updates
- **Save/Load System**: Persistent progress with backup and validation
- **Audio System**: Music, sound effects, and ambient audio
- **Settings Management**: Customizable controls and audio settings
- **Responsive UI**: Modern interface with smooth animations

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ElricStormking/FishingProject.git
cd FishingProject
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173` (or the port shown in terminal)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🎯 How to Play

### Basic Controls
- **WASD**: Move around (when applicable)
- **SPACE**: Start fishing / Cast line
- **Mouse**: Aim casting direction
- **I**: Open inventory
- **ESC**: Return to menu

### Fishing Process
1. **Cast**: Aim with mouse and press SPACE to cast your line
2. **Lure**: Wait for fish to bite, use mouse to attract fish
3. **Reel**: Click rapidly or hold to reel in the fish

### Progression
- Catch fish to gain experience and money
- Buy better equipment in the shop
- Unlock new fishing locations
- Complete achievements and milestones

## 🏗️ Project Structure

```
src/
├── scenes/           # Game scenes (Menu, Game, Shop, etc.)
├── scripts/          # Core game logic and systems
├── ui/              # User interface components
├── data/            # JSON configuration files
└── assets/          # Game assets (images, audio, etc.)
```

### Key Systems
- **GameState**: Central state management
- **PlayerController**: Handles player input and fishing mechanics
- **AudioManager**: Comprehensive audio system
- **InventoryManager**: Item storage and management
- **CraftingManager**: Equipment crafting system
- **SettingsManager**: User preferences and settings

## 🛠️ Development

### Technologies Used
- **Phaser 3**: Game engine
- **Vite**: Build tool and development server
- **JavaScript ES6+**: Modern JavaScript features
- **JSON**: Data configuration
- **HTML5 Canvas**: Rendering

### Code Style
- ES6 modules and classes
- Data-driven architecture
- Modular component design
- Comprehensive error handling

## 📝 Game Design Document

See `Luxury_Angler_GDD(updated).txt` for detailed game design specifications.

## 🎵 Audio System

The game features a comprehensive audio system with:
- Background music for different scenes
- Sound effects for all interactions
- Ambient sounds for immersion
- Volume controls and settings

*Note: Audio files are not included in the repository. Place your audio files in the appropriate directories under `src/assets/audio/`*

## 🔧 Configuration

Game content is configured through JSON files in the `src/data/` directory:
- Fish species and properties
- Equipment stats and costs
- UI settings and colors
- Fishing mechanics parameters

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎮 Screenshots

*Screenshots will be added as the game develops*

## 🚧 Development Status

This project is actively in development. Current focus areas:
- Audio system integration
- Content expansion
- Performance optimization
- Mobile responsiveness

## 📞 Contact

Project Link: [https://github.com/ElricStormking/FishingProject](https://github.com/ElricStormking/FishingProject)

---

*Built with ❤️ using Phaser 3* 