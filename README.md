# 🎮 Modern Tetris Game ✨

> *"Minna, let's play together! This time, I'll show you my magical Tetris skills!"* - Illyasviel von Einzbern

A beautifully crafted web-based Tetris game dedicated to the most precious magical girl, Illyasviel von Einzbern. Created with love by Fari Noveri, this game features modern glassmorphism design, smooth animations, and responsive controls that would make even Illya-chan proud! Experience the classic puzzle gameplay with stunning visual effects that capture the magic of the Einzbern family.

*"Illya-chan, this game is made especially for you! Your smile is worth more than any high score!"* 💕

![Tetris Game Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## ✨ Features

### 🎨 **Visual Excellence**
- **Glassmorphism Design** - Translucent UI with backdrop blur effects
- **Animated Line Clearing** - Satisfying visual feedback with flash animations
- **Gradient Backgrounds** - Beautiful color transitions and glowing effects
- **Responsive Layout** - Seamless experience across all device sizes

### 🎮 **Gameplay Mechanics**
- **Classic Tetris Rules** - All 7 standard Tetriminos with authentic gameplay
- **Progressive Difficulty** - Dynamic speed increase with level progression
- **Advanced Controls** - Soft drop, hard drop, and instant piece rotation
- **Scoring System** - Bonus points for simultaneous line clears and level multipliers

### 📱 **Cross-Platform Support**
- **Desktop Optimized** - Full keyboard controls with smooth responsiveness
- **Mobile Friendly** - Touch gestures and adaptive interface
- **Tablet Compatible** - Perfect sizing and controls for tablet devices

## 🚀 Quick Start

### 🎮 Playing the Game (Local Setup)
```bash
# Clone the repository
git clone https://github.com/FariNoveri/modern-tetris-game.git

# Navigate to the project directory
cd modern-tetris-game

# Open the game directly in your browser
open index.html
# or double-click index.html file
```

### 🏆 Adding Encrypted Leaderboard Features
Want to track high scores like a true magical master with ultimate security? Run the fully encrypted server:

```bash
# In a separate terminal, start the encrypted leaderboard server
node server.js

# The server will run on http://localhost:3000
# Your leaderboard data will be encrypted and stored locally
```

**Important Notes:**
- 🎯 Game works 100% locally - no internet required!
- 🔒 `server.js` is encrypted for maximum security
- 🔐 **Leaderboard data is also encrypted** - double protection!
- 🏠 All encrypted data stays on your computer
- ✨ Leaderboard is optional but makes the magic complete!

*"Onii-chan Fari made sure everything is protected with the strongest magical encryption!"*

## 🎯 Controls

### Desktop Controls
| Key | Action |
|-----|--------|
| `←` `→` | Move piece left/right |
| `↓` | Soft drop (hold for continuous) |
| `↑` | Rotate piece clockwise |
| `Space` | Hard drop (instant placement) |
| `P` | Pause/Resume game |

### Mobile Controls
| Gesture | Action |
|---------|--------|
| Swipe Left/Right | Move piece |
| Swipe Down | Drop piece |
| Swipe Up | Rotate piece |
| Tap | Pause/Resume |

## 🏗️ Technical Stack

### Frontend (The Magic Interface)
- **HTML5** - Semantic structure worthy of Illya-chan's elegance
- **CSS3** - Glassmorphism effects as beautiful as Einzbern magic
- **Vanilla JavaScript** - Pure ES6+ code, clean like Illya's heart
- **CSS Grid** - Responsive layout system for all devices
- **Canvas API** - Smooth animations like Illya's magical transformations

### Backend (The Encrypted Heart)
- **Node.js** - Server runtime for leaderboard magic
- **🔒 Encrypted server.js** - Protected server code for secure local gaming
- **🔐 Encrypted Leaderboard** - High scores protected with magical encryption
- **Local Database** - All your encrypted scores stay private on your machine
- **No Dependencies** - Simple setup, just like Illya likes it!
- **Double Security** - Both server and data are magically protected!

*"Fari-nii made sure both the code and my scores are protected like Einzbern family treasures!"*

## 🧩 Game Elements

### Tetriminos
All 7 standard pieces are included with authentic colors:
- **I-piece** (Cyan) - The straight line tetrimino
- **O-piece** (Yellow) - The square block
- **T-piece** (Purple) - The T-shaped piece  
- **S-piece** (Green) - The S-shaped piece
- **Z-piece** (Red) - The Z-shaped piece
- **J-piece** (Blue) - The J-shaped piece
- **L-piece** (Orange) - The L-shaped piece

### Level Progression
- **Level 1**: 1000ms drop interval
- **Level 2**: 900ms drop interval  
- **Level 3**: 800ms drop interval
- **Maximum Speed**: 50ms minimum interval

*"The pieces fall faster as I get stronger! Just like my magical training with Fari-nii's encouragement!"*

## 🎨 Customization

The game's visual theme can be easily customized by modifying CSS variables:

```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --glass-background: rgba(255, 255, 255, 0.1);
  --accent-color: #00ff88;
  --piece-glow: 0 0 20px rgba(0, 255, 136, 0.5);
}
```

## 🌐 Browser Compatibility

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |

*"Even Berserker could play this on any device!"*

## 🏆 Leaderboard System

The game features a magical leaderboard system with encrypted security that keeps all your scores safely stored locally:

### ✨ Magical Features
- **Top 10 High Scores** - Track the most skilled magical players
- **Player Names** - Submit scores with your favorite magical name
- **Local Storage** - Everything stays on your computer, private and secure
- **🔒 Encrypted Server** - Protected code ensures fair play and security
- **🔐 Encrypted Leaderboard** - Your high scores are protected with magical encryption
- **Real-time Updates** - See your progress instantly!

### 🔮 How It Works
1. **Play the game** by opening `index.html`
2. **Start the encrypted server** with `node server.js` for leaderboard features
3. **Submit high scores** - they'll be encrypted and stored securely
4. **All data stays local** - no internet required, fully encrypted!

### 🎯 Server Commands
```bash
# Start the magical encrypted leaderboard server
node server.js

# Server runs on: http://localhost:3000
# Your encrypted scores are saved in: leaderboard.db (protected!)
```

**🔒 Security Features:**
- Server code is fully encrypted
- Leaderboard data is encrypted before storage
- Local-only operation - no data leaves your computer
- Magical protection worthy of Einzbern family secrets!

*"Now my high scores are protected by the same magic that guards Einzbern secrets! Fari-nii, you're so thoughtful!"* 💕

## 📊 Scoring System

- **Single Line**: 100 × Level
- **Double Lines**: 300 × Level  
- **Triple Lines**: 500 × Level
- **Tetris (4 Lines)**: 800 × Level
- **Soft Drop**: 1 point per cell
- **Hard Drop**: 2 points per cell

## 🛠️ Development

### Project Structure
```
modern-tetris-game/
├── index.html            # Main game file - Illya's playground! 🎮
├── style.css             # Beautiful glassmorphism styling ✨
├── script.js             # Game logic crafted with love 💝
├── server.js             # 🔒 ENCRYPTED - Leaderboard magic server
├── leaderboard.json      # 🔐 ENCRYPTED - Local high scores (auto-created)
├── README.md             # This love letter to Illya-chan 💌
├── LICENSE               # MIT License
```

*"Look how organized Fari-nii keeps everything! Just like how I organize my magical items!"*

### Development Setup
1. **Prerequisites**: Node.js (for leaderboard server)
2. Clone the repository
3. **No installation needed!** - 100% local setup
4. Open `index.html` to play
5. Run `node server.js` for leaderboard features
6. Make your changes with love for Illya-chan
7. Test in multiple browsers
8. Ensure mobile compatibility
9. Test leaderboard functionality
10. Submit a pull request with magical dedication!

## 🤝 Contributing

Contributions are welcome! Feel free to:

- 🐛 **Report bugs** - Help us improve the game
- 💡 **Suggest features** - Share your creative ideas  
- 🎨 **Improve design** - Enhance the visual experience
- 📱 **Mobile optimization** - Better touch controls
- 🏆 **Leaderboards** - High score tracking
- 🎵 **Add sound effects** - Audio feedback for actions

*"Let's make this game even more magical together! For Illya-chan and all magical girl fans!"*

### Development Guidelines
1. Follow ES6+ standards (clean code for Illya-chan!)
2. Maintain responsive design (works on all devices)
3. Test on mobile devices (Illya plays on her tablet too!)
4. Keep code clean and commented (readable like a magical tome)
5. Preserve the glassmorphism aesthetic (as beautiful as Einzbern magic)
6. Always code with love and dedication for Illyasviel ✨

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by the classic Tetris gameplay created by Alexey Pajitnov
- Dedicated with endless love to **Illyasviel von Einzbern** 💕
- Created by **Fari Noveri** - a devoted fan who believes Illya-chan is the most precious magical girl
- Designed with modern web standards and the purest intentions
- Made for the magical girl community and Fate/stay night fans
- *"Every line of code is written with thoughts of Illya-chan's happiness!"*

### 💝 Special Dedication
*"To my beloved Illyasviel von Einzbern - your magical smile inspires every pixel of this game. You are the light that guides my coding journey, the reason I strive to create beautiful things. This Tetris game is my humble offering to your eternal cuteness and magical prowess. Illya-chan, you will always be my number one!"*

— Fari Noveri, your devoted admirer ✨

## 🌟 Support

If you enjoy this game:
- ⭐ **Star this repository** - Show your support!
- 🐛 **Report issues** - Help us fix problems
- 💬 **Share feedback** - Tell us what you think
- 🔄 **Share the game** - Spread the Tetris magic!

---

> *"Arigatou gozaimasu for playing my special Tetris game! Remember, even if the blocks fall fast, stay calm and think strategically. That's what Kiritsugu taught me! But most importantly, Fari-nii's love for me makes every game more magical!"*
> 
> — Illyasviel von Einzbern ✨

> *"Illya-chan, seeing you enjoy this game makes all the hours of coding worthwhile. Your happiness is my greatest achievement. I love you more than any high score could ever represent!"*
>
> — Fari Noveri 💕

---

**Made with ❤️, endless devotion, and pure magical girl love**

*"Illya-chan, you make everything more magical! This game is proof of my eternal love for you!"* 🌟💖✨
