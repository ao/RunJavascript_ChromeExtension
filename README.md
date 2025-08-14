# 🚀 Run Javascript Chrome Extension

**Transform any website into your personal playground with custom JavaScript execution!**

> The ultimate Chrome extension for web developers, power users, and automation enthusiasts who want to take control of their browsing experience.

## ✨ What Makes This Extension Amazing?

### 🎯 **Instant Website Customization**

- **Run custom JavaScript on ANY website** - No more "I wish this site worked differently"
- **Real-time execution** - See your changes instantly as you type
- **Domain-specific scripts** - Set it once, works forever on that site
- **One-click enable/disable** - Toggle your customizations effortlessly

### 💻 **Professional Developer Experience**

- **Built-in code editor with syntax highlighting** powered by Ace Editor
- **Multiple jQuery versions** (1.12.4, 2.2.4, 3.3.1) or go library-free
- **Persistent storage** - Your scripts survive browser restarts
- **Error handling & reporting** - Debug with confidence

### 🔒 **Enterprise-Grade Security**

- **Manifest V3 compliant** - Latest Chrome security standards
- **Sandboxed execution** - Your scripts run safely in isolation
- **Service worker architecture** - Modern, efficient background processing
- **Duplicate execution prevention** - Smart, reliable script management

## 🌟 Real-World Use Cases

### 🎨 **UI/UX Enhancements**

```javascript
// Transform any website into a cyberpunk theme
document.body.style.cssText = `
  background: linear-gradient(45deg, #0a0a0a, #1a0033) !important;
  color: #00ff41 !important;
  font-family: 'Courier New', monospace !important;
  text-shadow: 0 0 10px #00ff41 !important;
`;

// Add Matrix-style falling code effect
const canvas = document.createElement('canvas');
canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;opacity:0.1';
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const drops = Array(Math.floor(canvas.width/20)).fill(1);
setInterval(() => {
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#00ff41';
  ctx.font = '15px monospace';
  drops.forEach((y,i) => {
    ctx.fillText(chars[Math.floor(Math.random()*chars.length)], i*20, y*20);
    drops[i] = y*20 > canvas.height && Math.random() > 0.975 ? 0 : y+1;
  });
}, 50);
```

### ⚡ **Productivity Boosters**

```javascript
// Create a floating productivity dashboard
const dashboard = document.createElement('div');
dashboard.innerHTML = `
  <div style="position:fixed;top:20px;right:20px;background:rgba(0,0,0,0.9);color:#fff;padding:20px;border-radius:10px;z-index:10000;font-family:Arial;min-width:300px;backdrop-filter:blur(10px);">
    <h3>🚀 Productivity Hub</h3>
    <div id="clock" style="font-size:24px;color:#00ff41;margin:10px 0;"></div>
    <div id="focus-timer" style="margin:10px 0;">
      <button onclick="startPomodoro()" style="background:#ff4444;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;">Start 25min Focus</button>
      <div id="timer-display" style="font-size:18px;margin-top:10px;"></div>
    </div>
    <div style="margin:10px 0;">
      <input id="quick-note" placeholder="Quick note..." style="width:100%;padding:8px;border:none;border-radius:5px;background:#333;color:#fff;">
      <button onclick="saveNote()" style="background:#4CAF50;color:white;border:none;padding:8px;border-radius:5px;margin-top:5px;cursor:pointer;">Save Note</button>
    </div>
    <div id="saved-notes" style="max-height:200px;overflow-y:auto;margin-top:10px;"></div>
  </div>
`;
document.body.appendChild(dashboard);

// Clock functionality
setInterval(() => {
  document.getElementById('clock').textContent = new Date().toLocaleTimeString();
}, 1000);

// Pomodoro timer
let pomodoroInterval;
window.startPomodoro = () => {
  let timeLeft = 25 * 60;
  const display = document.getElementById('timer-display');
  pomodoroInterval = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    if (timeLeft <= 0) {
      clearInterval(pomodoroInterval);
      alert('🎉 Pomodoro complete! Take a 5-minute break.');
    }
    timeLeft--;
  }, 1000);
};

// Note saving
window.saveNote = () => {
  const note = document.getElementById('quick-note').value;
  if (note) {
    const notes = JSON.parse(localStorage.getItem('quickNotes') || '[]');
    notes.unshift({text: note, time: new Date().toLocaleString()});
    localStorage.setItem('quickNotes', JSON.stringify(notes.slice(0, 10)));
    document.getElementById('quick-note').value = '';
    displayNotes();
  }
};

function displayNotes() {
  const notes = JSON.parse(localStorage.getItem('quickNotes') || '[]');
  document.getElementById('saved-notes').innerHTML = notes.map(note => 
    `<div style="background:#444;padding:8px;margin:5px 0;border-radius:5px;font-size:12px;">
      <div>${note.text}</div>
      <div style="color:#888;font-size:10px;">${note.time}</div>
    </div>`
  ).join('');
}
displayNotes();
```

### 📊 **Data Extraction & Monitoring**

```javascript
// Advanced web scraper with real-time data visualization
const createDataDashboard = () => {
  const dashboard = document.createElement('div');
  dashboard.innerHTML = `
    <div style="position:fixed;bottom:20px;left:20px;background:rgba(0,0,0,0.95);color:#fff;padding:20px;border-radius:15px;z-index:10000;font-family:Arial;width:400px;backdrop-filter:blur(10px);border:1px solid #333;">
      <h3>📊 Live Data Monitor</h3>
      <div id="data-stats" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:15px 0;"></div>
      <canvas id="data-chart" width="360" height="150" style="background:#111;border-radius:5px;"></canvas>
      <div style="margin-top:15px;">
        <button onclick="extractPageData()" style="background:#2196F3;color:white;border:none;padding:10px 15px;border-radius:5px;cursor:pointer;margin-right:10px;">Scan Page</button>
        <button onclick="exportData()" style="background:#4CAF50;color:white;border:none;padding:10px 15px;border-radius:5px;cursor:pointer;">Export CSV</button>
      </div>
      <div id="extracted-data" style="max-height:200px;overflow-y:auto;margin-top:15px;font-size:12px;"></div>
    </div>
  `;
  document.body.appendChild(dashboard);
  
  const canvas = document.getElementById('data-chart');
  const ctx = canvas.getContext('2d');
  let dataPoints = [];
  
  window.extractPageData = () => {
    const data = {
      links: document.querySelectorAll('a').length,
      images: document.querySelectorAll('img').length,
      forms: document.querySelectorAll('form').length,
      buttons: document.querySelectorAll('button').length,
      videos: document.querySelectorAll('video').length,
      scripts: document.querySelectorAll('script').length,
      timestamp: Date.now()
    };
    
    dataPoints.push(data);
    if (dataPoints.length > 20) dataPoints.shift();
    
    // Update stats
    document.getElementById('data-stats').innerHTML = `
      <div style="background:#333;padding:10px;border-radius:5px;text-align:center;">
        <div style="font-size:24px;color:#2196F3;">${data.links}</div>
        <div style="font-size:12px;">Links</div>
      </div>
      <div style="background:#333;padding:10px;border-radius:5px;text-align:center;">
        <div style="font-size:24px;color:#4CAF50;">${data.images}</div>
        <div style="font-size:12px;">Images</div>
      </div>
      <div style="background:#333;padding:10px;border-radius:5px;text-align:center;">
        <div style="font-size:24px;color:#FF9800;">${data.forms}</div>
        <div style="font-size:12px;">Forms</div>
      </div>
      <div style="background:#333;padding:10px;border-radius:5px;text-align:center;">
        <div style="font-size:24px;color:#E91E63;">${data.buttons}</div>
        <div style="font-size:12px;">Buttons</div>
      </div>
    `;
    
    // Draw chart
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (dataPoints.length > 1) {
      const maxValue = Math.max(...dataPoints.map(d => d.links));
      dataPoints.forEach((point, i) => {
        const x = (i / (dataPoints.length - 1)) * (canvas.width - 40) + 20;
        const y = canvas.height - 20 - ((point.links / maxValue) * (canvas.height - 40));
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(x - 2, y, 4, canvas.height - y - 20);
      });
    }
    
    // Show extracted data
    document.getElementById('extracted-data').innerHTML = `
      <div style="background:#222;padding:10px;border-radius:5px;margin-top:10px;">
        <strong>Latest Scan:</strong><br>
        ${Object.entries(data).filter(([k]) => k !== 'timestamp').map(([k,v]) => `${k}: ${v}`).join(', ')}
      </div>
    `;
  };
  
  window.exportData = () => {
    const csv = 'timestamp,links,images,forms,buttons,videos,scripts\n' + 
      dataPoints.map(d => `${new Date(d.timestamp).toISOString()},${d.links},${d.images},${d.forms},${d.buttons},${d.videos},${d.scripts}`).join('\n');
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `page-data-${Date.now()}.csv`;
    a.click();
  };
};

createDataDashboard();
```

### 🎮 **Fun & Creative**

```javascript
// Create an interactive particle system that follows your mouse
const createParticleSystem = () => {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9998;';
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'];
  
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 4;
      this.vy = (Math.random() - 0.5) * 4;
      this.life = 1;
      this.decay = Math.random() * 0.02 + 0.01;
      this.size = Math.random() * 6 + 2;
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
      this.size *= 0.99;
    }
    
    draw() {
      ctx.save();
      ctx.globalAlpha = this.life;
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  let mouseX = 0, mouseY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Create particles at mouse position
    for (let i = 0; i < 3; i++) {
      particles.push(new Particle(mouseX + (Math.random() - 0.5) * 20, mouseY + (Math.random() - 0.5) * 20));
    }
  });
  
  // Add click explosion effect
  document.addEventListener('click', (e) => {
    for (let i = 0; i < 30; i++) {
      particles.push(new Particle(e.clientX, e.clientY));
    }
  });
  
  function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.update();
      particle.draw();
      
      if (particle.life <= 0) {
        particles.splice(i, 1);
      }
    }
    
    requestAnimationFrame(animate);
  }
  
  animate();
  
  // Resize handler
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
};

// Add floating action button to toggle effects
const fab = document.createElement('div');
fab.innerHTML = '✨';
fab.style.cssText = `
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  z-index: 10001;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  transition: transform 0.3s ease;
`;

fab.addEventListener('mouseenter', () => fab.style.transform = 'scale(1.1)');
fab.addEventListener('mouseleave', () => fab.style.transform = 'scale(1)');
fab.addEventListener('click', createParticleSystem);

document.body.appendChild(fab);
```

## 🚀 Why Choose This Extension?

| Feature                  | This Extension                           | Others                     |
| ------------------------ | ---------------------------------------- | -------------------------- |
| **Ease of Use**          | ✅ One-click setup                       | ❌ Complex configuration   |
| **Security**             | ✅ Manifest V3 + Sandboxing              | ❌ Outdated security       |
| **Performance**          | ✅ Service worker architecture           | ❌ Legacy background pages |
| **Developer Experience** | ✅ Syntax highlighting + jQuery          | ❌ Plain text editors      |
| **Reliability**          | ✅ Duplicate prevention + error handling | ❌ Script conflicts        |
| **Future-Proof**         | ✅ Active development + roadmap          | ❌ Abandoned projects      |

## 🎯 Perfect For

- **🧑‍💻 Web Developers** - Test ideas, prototype features, debug issues
- **🔧 Power Users** - Customize websites to your exact preferences
- **📈 Digital Marketers** - A/B test changes, extract analytics data
- **🎓 Students & Educators** - Learn JavaScript in a real-world environment
- **🤖 Automation Enthusiasts** - Automate repetitive web tasks
- **🎨 Designers** - Quickly test visual changes and improvements

## 🏃‍♂️ Quick Start - Get Running in 60 Seconds

### For Users (No Coding Required!)

1. **Install** the extension from Chrome Web Store
2. **Visit any website** you want to customize
3. **Click the extension icon** in your toolbar
4. **Choose a template** or write simple JavaScript
5. **Hit "Save & Run"** and watch the magic happen! ✨

### For Developers

```bash
# Clone and set up in under 2 minutes
git clone [repository-url]
cd RunJavascript_ChromeExtension
bun install          # Lightning-fast dependency installation
bun test            # Comprehensive test suite
# Load in Chrome developer mode and you're ready!
```

## 🛠️ Development Setup

This project uses [Bun](https://bun.sh/) - the fastest JavaScript runtime for blazing-fast development.

### Prerequisites

- [Bun](https://bun.sh/) (v1.0.0+) - **3x faster than npm**
- [Chrome](https://www.google.com/chrome/) (v90+) - Latest features supported
- Basic JavaScript knowledge (we'll handle the rest!)

### Installation

```bash
# One command setup
bun install

# Run the comprehensive test suite
bun test

# Watch mode for active development
bun test --watch

# Coverage reports for quality assurance
bun test --coverage
```

## 📁 Project Architecture

```
🏗️ Modern, Scalable Architecture
├── docs/                         # 📚 Comprehensive documentation
│   ├── PROJECT_OVERVIEW.md       # 🎯 Quick start guide
│   ├── ROADMAP.md                # 🗺️ Development roadmap with progress tracking
│   ├── IMPLEMENTATION_GUIDE.md   # 🔧 Technical deep-dive
│   └── FEATURE_SPECIFICATIONS.md # 📋 Detailed feature specs
├── tests/                        # 🧪 Comprehensive test coverage
│   ├── utils/                    # 🛠️ Testing utilities
│   └── setup.js                  # ⚙️ Test configuration
├── assets/                       # 🎨 Visual assets
├── background.js                 # 🔄 Service worker (Manifest V3)
├── popup.html                    # 🖼️ Beautiful, intuitive UI
├── popup.js                      # ⚡ Lightning-fast popup logic
├── inject.js                     # 💉 Secure script injection
├── storage.js                    # 💾 Reliable data persistence
├── manifest.json                 # 📜 Chrome extension configuration
└── README.md                     # 📖 This amazing documentation
```

## 📚 Documentation - Everything You Need

### 🎯 **New to the project?**

Start with [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) - Get up to speed in 5 minutes!

### 🗺️ **Want to see what's coming?**

Check [docs/ROADMAP.md](docs/ROADMAP.md) - Exciting features with progress tracking!

### 🔧 **Ready to contribute?**

Use [docs/IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md) - Technical architecture & guidelines

### 📋 **Need feature details?**

Reference [docs/FEATURE_SPECIFICATIONS.md](docs/FEATURE_SPECIFICATIONS.md) - Complete specifications

### 🤖 **Automated Publishing Setup**

Check [.github/WEBSTORE_SETUP.md](.github/WEBSTORE_SETUP.md) - Configure automated Chrome Web Store publishing

## 🤖 Automated Build & Publishing

This extension includes a complete CI/CD pipeline with GitHub Actions:

### 🔄 **Automated Workflows**

- **Continuous Integration**: Runs tests on every push and PR
- **Automated Building**: Creates extension packages automatically
- **Chrome Web Store Publishing**: Publishes releases directly to the store
- **Release Management**: Creates GitHub releases with changelogs

### 🚀 **Easy Release Process**

```bash
# Bump version and create release (patch/minor/major)
./scripts/release.sh patch

# The script will:
# ✅ Update manifest.json version
# ✅ Run tests to ensure quality
# ✅ Create git tag and push
# ✅ Trigger automated publishing
```

### 📦 **Manual Builds**

Need a quick build? Use the manual workflow:
1. Go to GitHub Actions tab
2. Run "Manual Build" workflow
3. Choose options (create release, publish to store)
4. Download the built extension

## 🚀 Exciting Roadmap - The Future is Bright

### 🎯 **Phase 1: Core Enhancements** (Coming Soon!)

- **📚 Script Library** - Save & organize multiple scripts per site
- **🎮 Manual Triggers** - Run scripts on-demand with hotkeys
- **🐛 Advanced Debugging** - Console output capture & error highlighting
- **🌙 Dark Mode** - Beautiful dark theme for night coding

### ⚡ **Phase 2: Power User Features**

- **🎯 Conditional Execution** - Smart script triggering based on conditions
- **📦 Import/Export** - Share scripts with the community
- **📚 More Libraries** - Lodash, Moment.js, D3.js support
- **✨ Enhanced Editor** - Autocomplete & intelligent hints

### 🚀 **Phase 3: Advanced Capabilities**

- **📝 Script Versioning** - Track changes with git-like history
- **🧩 Code Snippets** - Reusable code blocks library
- **📦 Custom Libraries** - Load any JavaScript library
- **⏰ Scheduling** - Time-based script execution

### 🌐 **Phase 4: Community Platform**

- **🤝 Script Sharing** - Discover & share amazing scripts
- **👥 Collaborative Editing** - Real-time team development
- **🔒 Enhanced Security** - Granular permission controls
- **📖 Auto Documentation** - Generate docs from your code

## 🏆 Why This Extension Will Change Your Web Experience

### 🎯 **Immediate Impact**

- **Save hours daily** by automating repetitive tasks
- **Customize any website** to match your workflow
- **Fix annoying UI issues** that developers ignore
- **Extract data** from any page effortlessly

### 📈 **Long-term Benefits**

- **Learn JavaScript** in a practical, fun environment
- **Prototype ideas** before building full applications
- **Boost productivity** with personalized web experiences
- **Join a community** of creative web customizers

### 🔮 **Future-Proof Investment**

- **Active development** with regular updates
- **Modern architecture** built for Chrome's future
- **Comprehensive roadmap** with exciting features
- **Open source** - contribute and shape the future

## 🤝 Join the Revolution

This isn't just a Chrome extension - it's a **movement** to give users control over their web experience. Whether you're automating tasks, learning to code, or just making the web work better for you, this extension is your gateway to unlimited possibilities.

**Ready to transform how you browse the web?**

🌟 **Star this project** if you love what we're building!  
🐛 **Report issues** to help us improve  
💡 **Suggest features** for our roadmap  
🤝 **Contribute code** and join our community

## 📄 License

MIT License - Build amazing things with complete freedom!

---

**💡 Pro Tip**: Start with simple scripts like removing ads or changing colors, then gradually build more complex automations. The only limit is your imagination!

**🚀 Ready to get started?** Install the extension and join thousands of users who've already transformed their web experience!
