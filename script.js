class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Game elements
        this.cube = {
            x: 50,
            y: 50,
            size: 30,
            speed: 5
        };
        
        // Trail system
        this.trail = [];
        this.trailColors = [
            '#FF6B6B',  // Warm Red
            '#4ECDC4',  // Turquoise
            '#45B7D1',  // Ocean Blue
            '#96CEB4',  // Sage Green
            '#FFBE0B',  // Sunshine Yellow
            '#FF006E',  // Hot Pink
            '#8338EC'   // Purple
        ];
        this.trailLength = 20;
        this.trailUpdateCounter = 0;
        this.trailUpdateFrequency = 2;

        this.menuItems = [
            { x: 200, y: 150, width: 100, height: 100, content: 'About Us', color: '#FF6B6B' },
            { x: 400, y: 300, width: 100, height: 100, content: 'Blogs', color: '#4ECDC4' },
            { x: 600, y: 150, width: 100, height: 100, content: 'Our Games', color: '#45B7D1' },
            { x: 200, y: 450, width: 100, height: 100, content: 'Contact', color: '#96CEB4' }
        ];

        // Paint splashes array
        this.paintSplashes = [];

        // Controls
        this.keys = {
            w: false,
            s: false,
            a: false,
            d: false
        };

        // Mobile detection and controls
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.gyroscopeAvailable = false;
        this.touchControls = {
            active: false,
            startX: 0,
            startY: 0
        };

        // Modal elements
        this.modal = document.getElementById('modal');
        this.modalContent = document.getElementById('modal-content');
        this.closeBtn = document.querySelector('.close-btn');

        // Event listeners
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        this.closeBtn.addEventListener('click', () => this.closeModal());

        // Mobile-specific event listeners
        if (this.isMobile) {
            // Touch controls
            this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
            this.canvas.addEventListener('touchend', () => this.handleTouchEnd());

            // Request gyroscope permission and setup
            if (window.DeviceOrientationEvent) {
                if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                    // iOS 13+ requires permission
                    document.body.addEventListener('click', () => {
                        DeviceOrientationEvent.requestPermission()
                            .then(permissionState => {
                                if (permissionState === 'granted') {
                                    window.addEventListener('deviceorientation', (e) => this.handleGyroscope(e));
                                    this.gyroscopeAvailable = true;
                                }
                            })
                            .catch(console.error);
                    }, { once: true });
                } else {
                    // Non-iOS devices
                    window.addEventListener('deviceorientation', (e) => this.handleGyroscope(e));
                    this.gyroscopeAvailable = true;
                }
            }
        }

        // Start game loop
        this.gameLoop();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    handleKeyDown(e) {
        if (e.key.toLowerCase() in this.keys) {
            this.keys[e.key.toLowerCase()] = true;
        }
    }

    handleKeyUp(e) {
        if (e.key.toLowerCase() in this.keys) {
            this.keys[e.key.toLowerCase()] = false;
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchControls.active = true;
        this.touchControls.startX = touch.clientX;
        this.touchControls.startY = touch.clientY;
    }

    handleTouchMove(e) {
        if (!this.touchControls.active) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchControls.startX;
        const deltaY = touch.clientY - this.touchControls.startY;
        
        // Update cube position based on touch movement
        this.cube.x += deltaX * 0.1;
        this.cube.y += deltaY * 0.1;
        
        // Update touch reference points
        this.touchControls.startX = touch.clientX;
        this.touchControls.startY = touch.clientY;
        
        // Keep cube within bounds
        this.cube.x = Math.max(0, Math.min(this.canvas.width - this.cube.size, this.cube.x));
        this.cube.y = Math.max(0, Math.min(this.canvas.height - this.cube.size, this.cube.y));
    }

    handleTouchEnd() {
        this.touchControls.active = false;
    }

    handleGyroscope(e) {
        if (!this.gyroscopeAvailable || !e.gamma || !e.beta) return;

        // Adjust sensitivity based on screen orientation
        const isLandscape = window.innerWidth > window.innerHeight;
        const sensitivity = isLandscape ? 0.7 : 0.5;

        // Get orientation values
        let gammaValue = e.gamma; // Left/Right tilt (-90 to 90)
        let betaValue = e.beta;   // Front/Back tilt (-180 to 180)

        // Clamp values
        gammaValue = Math.max(-45, Math.min(45, gammaValue)) * sensitivity;
        betaValue = Math.max(-45, Math.min(45, betaValue)) * sensitivity;

        // Calculate movement
        const moveX = (gammaValue / 45) * this.cube.speed * 2;
        const moveY = (betaValue / 45) * this.cube.speed * 2;

        // Update cube position
        this.cube.x += moveX;
        this.cube.y += moveY;

        // Keep cube within bounds
        this.cube.x = Math.max(0, Math.min(this.canvas.width - this.cube.size, this.cube.x));
        this.cube.y = Math.max(0, Math.min(this.canvas.height - this.cube.size, this.cube.y));
    }

    moveCube() {
        if (this.keys.w) this.cube.y -= this.cube.speed;
        if (this.keys.s) this.cube.y += this.cube.speed;
        if (this.keys.a) this.cube.x -= this.cube.speed;
        if (this.keys.d) this.cube.x += this.cube.speed;

        // Keep cube within bounds
        this.cube.x = Math.max(0, Math.min(this.canvas.width - this.cube.size, this.cube.x));
        this.cube.y = Math.max(0, Math.min(this.canvas.height - this.cube.size, this.cube.y));
    }

    checkCollisions() {
        const cubeRect = {
            x: this.cube.x,
            y: this.cube.y,
            width: this.cube.size,
            height: this.cube.size
        };

        for (const item of this.menuItems) {
            if (this.intersects(cubeRect, item)) {
                this.createPaintSplash(
                    this.cube.x + this.cube.size/2,
                    this.cube.y + this.cube.size/2,
                    item.color
                );
                this.openModal(item.content);
                this.resetCube();
                break;
            }
        }
    }

    intersects(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    openModal(content) {
        this.modalContent.innerHTML = `<h2>${content}</h2>
            <p>This is the ${content} section. Add your content here!</p>`;
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    resetCube() {
        this.cube.x = 50;
        this.cube.y = 50;
    }

    createPaintSplash(x, y, color) {
        const numDroplets = 20;
        for (let i = 0; i < numDroplets; i++) {
            const angle = (Math.PI * 2 * i) / numDroplets;
            const velocity = 2 + Math.random() * 3;
            const size = 3 + Math.random() * 5;
            
            this.paintSplashes.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: size,
                color: color,
                alpha: 1,
                gravity: 0.2,
                life: 1
            });
        }
    }

    updatePaintSplashes() {
        for (let i = this.paintSplashes.length - 1; i >= 0; i--) {
            const splash = this.paintSplashes[i];
            
            // Update position
            splash.x += splash.vx;
            splash.y += splash.vy;
            splash.vy += splash.gravity;
            
            // Update life and alpha
            splash.life -= 0.02;
            splash.alpha = splash.life;
            
            // Remove dead splashes
            if (splash.life <= 0) {
                this.paintSplashes.splice(i, 1);
            }
        }
    }

    drawPaintSplashes() {
        for (const splash of this.paintSplashes) {
            this.ctx.save();
            this.ctx.globalAlpha = splash.alpha;
            this.ctx.fillStyle = splash.color;
            
            // Draw droplet
            this.ctx.beginPath();
            this.ctx.arc(splash.x, splash.y, splash.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add glow effect
            this.ctx.shadowColor = splash.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }

    updateTrail() {
        this.trailUpdateCounter++;
        
        // Only update trail every few frames for performance
        if (this.trailUpdateCounter >= this.trailUpdateFrequency) {
            this.trailUpdateCounter = 0;
            
            // Add new trail particle
            this.trail.unshift({
                x: this.cube.x + this.cube.size / 2,
                y: this.cube.y + this.cube.size / 2,
                size: this.cube.size * 0.8,
                alpha: 1,
                color: this.trailColors[Math.floor(Math.random() * this.trailColors.length)]
            });
            
            // Remove old trail particles
            if (this.trail.length > this.trailLength) {
                this.trail.pop();
            }
        }
        
        // Update existing trail particles
        this.trail.forEach((particle, index) => {
            particle.alpha = 1 - (index / this.trailLength);
            particle.size = this.cube.size * (1 - index / this.trailLength) * 0.8;
        });
    }

    drawTrail() {
        this.trail.forEach((particle, index) => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha * 0.7;
            this.ctx.fillStyle = particle.color;
            
            // Draw particle with glow effect
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 15;
            
            // Draw as a circle for smoother look
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw paint splashes
        this.updatePaintSplashes();
        this.drawPaintSplashes();

        // Update and draw trail
        this.updateTrail();
        this.drawTrail();

        // Draw menu items with glow effect
        for (const item of this.menuItems) {
            this.ctx.save();
            
            // Glow effect
            this.ctx.shadowColor = item.color;
            this.ctx.shadowBlur = 20;
            
            // Draw item
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(item.x, item.y, item.width, item.height);
            
            // Draw text
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(item.content, item.x + item.width/2, item.y + item.height/2);
            
            this.ctx.restore();
        }

        // Draw cube with trail effect
        this.ctx.save();
        this.ctx.shadowColor = '#fff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.cube.x, this.cube.y, this.cube.size, this.cube.size);
        this.ctx.restore();
    }

    gameLoop() {
        this.moveCube();
        this.checkCollisions();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the window loads
window.addEventListener('load', () => {
    new Game();
});
