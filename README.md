# 🎮 Modern Tetris Game

> "Minna, let's play together! This time, I'll show you my magical Tetris skills!" - Illyasviel von Einzbern

A beautifully crafted web-based Tetris game with modern glassmorphism design and smooth animations. Experience the classic puzzle gameplay with a touch of magical aesthetics that would make even the Einzbern family proud!

## ✨ Features

- 🎨 **Glassmorphism Design** - Beautiful translucent UI with backdrop blur effects
- 📱 **Mobile Responsive** - Touch controls for seamless mobile gameplay  
- 🌈 **Animated Effects** - Smooth line clearing animations and visual feedback
- ⚡ **Modern Controls** - Soft drop, hard drop, and responsive piece movement
- 🎵 **Progressive Difficulty** - Level system with increasing speed
- 💫 **Visual Polish** - Gradient backgrounds and glowing effects
- 🎯 **Score System** - Bonus points for advanced techniques

> "Onii-chan, look how pretty the blocks are when they disappear!"

## 🔥 What's New in v2.0.0 - Illya Edition

This major update brings exciting new features that make the gameplay experience even more magical!

### 🏆 Online Leaderboard System
- Submit your high scores to the server and compete with other players
- Real-time score tracking and ranking system
- Elegant notification modal when server is not running
- Retry functionality with smooth error handling

### 🎮 Enhanced Control System
- Advanced input handling with hold-to-repeat functionality
- Configurable initial delay and repeat rate for precision gameplay
- Perfect for speedrun enthusiasts and competitive play
- Smooth, responsive controls that feel natural

### 🎵 Interactive Music Panel
- Draggable music panel - position it anywhere you like
- Auto-hide feature that appears on mouse movement
- Multiple music track selection
- Automatic track progression when songs end
- Immersive audio experience

### 🔄 Perfect Rotation System
- Implements authentic Super Rotation System (SRS) algorithm
- Advanced wall kick logic for seamless rotation near boundaries
- Special handling for I-piece rotations
- Professional-grade piece movement mechanics

### 💥 Dynamic Combo System
- Consecutive line clears trigger exciting COMBO multipliers
- Animated COMBO x2, x3, x4+ notifications
- Dramatic COMBO BREAK effects when streak ends
- Visual feedback that enhances the competitive spirit

### ⚠️ Smart Server Status Notifications
- Intelligent detection when backend server is not running
- Clear instructions: "server.js file required" and "Run with: node server.js"
- Retry button with connection attempt feedback
- Shake animation effects for failed connections

### 📱 Advanced Mobile Support
- Intuitive swipe gestures for movement, rotation, and dropping
- Tap controls for piece rotation
- Long-press for hard drop functionality
- Optimized touch response and feedback

### 🛠️ Enhanced User Experience
- Comprehensive error handling and user feedback
- Improved game over and pause overlay designs
- Smooth transitions and professional UI polish
- Better visual hierarchy and information display

## 🚀 Quick Start

### For Basic Gameplay
Simply open `index.html` in any modern web browser - no installation required!

### For Full Experience with Online Features
1. Clone the repository to your local machine
2. Start the backend server: `node server.js`
3. Open `index.html` in your favorite modern browser
4. Enjoy the complete gaming experience with online leaderboards!

```bash
# Clone the repository
git clone https://github.com/FariNoveri/modern-tetris-game.git

# Navigate to the project directory
cd modern-tetris-game

# Start the server for online features
node server.js

# Open in browser
open index.html
```

## 🕹️ Controls

### Desktop Controls
- **←/→ Arrow Keys** - Move piece left/right
- **↓ Arrow Key** - Soft drop (hold for continuous)
- **↑ Arrow Key** - Rotate piece  
- **Spacebar** - Hard drop (instant placement)

### Mobile Controls
- **Swipe Left/Right** - Move piece horizontally
- **Swipe Down** - Drop piece faster
- **Swipe Up** - Rotate piece
- **Tap** - Alternative rotation method
- **Long Press** - Hard drop

## 🏆 Scoring System

- **Single Line Clear** - Base points for clearing one line
- **Multiple Line Clear** - Bonus multipliers for clearing 2, 3, or 4 lines
- **Combo Multiplier** - Additional points for consecutive line clears
- **Level Bonus** - All points multiplied by current level
- **Speed Bonus** - Extra points for fast placement

> "I'm getting better at this! Watch me clear four lines at once and get that COMBO!"

## 🛠️ Technology Stack

- **HTML5** - Semantic structure and modern web standards
- **CSS3** - Advanced animations, gradients, and glassmorphism effects
- **Vanilla JavaScript** - Pure JS with sophisticated game logic
- **Node.js** - Backend server for leaderboard functionality
- **CSS Grid & Flexbox** - Responsive layout system

## 🌐 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+  
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers with touch support

> "Even Berserker could play this smoothly on any device!"

## 🎲 Game Pieces

The game includes all 7 standard Tetriminos with perfect SRS rotation:

- **I-piece** (Cyan) - The straight line with special rotation behavior
- **O-piece** (Yellow) - The square that never rotates
- **T-piece** (Purple) - The versatile T-shape
- **S-piece** (Green) - The S-shape zigzag
- **Z-piece** (Red) - The Z-shape zigzag
- **J-piece** (Blue) - The J-shaped hook
- **L-piece** (Orange) - The L-shaped hook

## ⚡ Level Progression

- **Level 1**: 1000ms drop interval - Perfect for beginners
- **Level 2**: 900ms drop interval - Getting warmed up
- **Level 3**: 800ms drop interval - The pace picks up
- **Level 10+**: Down to 100ms interval - Expert territory
- **Maximum Speed**: 50ms interval - Only for the truly skilled

> "The pieces fall faster as I get stronger! Just like my magical training sessions!"

## 🎨 Visual Features

- **Line Clear Animation** - Satisfying flash effect with particle explosions
- **Combo Animations** - Dynamic text effects for combo multipliers
- **Score Flash** - Real-time visual feedback for point gains
- **Glassmorphism UI** - Modern translucent design with depth
- **Gradient Backgrounds** - Beautiful animated color transitions
- **Glowing Effects** - Subtle lighting on active pieces and UI elements
- **Smooth Transitions** - Professional animations throughout

## 📱 Responsive Design

- **Desktop First** - Optimized for competitive desktop gameplay
- **Mobile Adapted** - Touch-friendly controls and scaled UI
- **Tablet Support** - Perfect sizing for tablet gaming sessions
- **Flexible Layout** - Adapts to any screen size or orientation

> "It looks magical on Onii-chan's gaming setup and plays perfectly on my tablet too!"

## 🎨 Customization

The game's visual theme can be easily customized by modifying the CSS variables:

```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --glass-background: rgba(255, 255, 255, 0.1);
  --accent-color: #00ff88;
  --combo-color: #ff6b6b;
  --success-color: #51cf66;
}
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

- 🐛 Report bugs and issues
- 💡 Suggest new features and improvements
- 🎨 Enhance the visual design and animations
- 📱 Improve mobile and touch experience
- 🎵 Add new music tracks or sound effects
- 🏆 Enhance the leaderboard system

> "Let's make this game even more magical together! Every contribution makes it better!"

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by the classic Tetris gameplay mechanics
- Built with modern web standards and best practices
- Created with love for the gaming community
- Enhanced with feedback from amazing players worldwide
- "And sprinkled with a little bit of Einzbern magic!"

## 💬 Final Words

> "Arigatou gozaimasu for playing my enhanced Tetris game! Remember, even when the blocks fall fast and combos get intense, stay calm and think strategically. With the new features, you can now compete with players worldwide and enjoy your favorite music while playing. That's what makes gaming truly magical!"
> 
> - Illyasviel von Einzbern ✨

---

⭐ **If you enjoyed this game, please give it a star!** ⭐  
*"Stars make everything more magical, and they help other players discover this awesome game too!"*

**Play now, compete globally, and may the best Tetris master win!** 🏆
