class Game {
    constructor() {
        // Initialize canvas first
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.touchControls = {
            active: false,
            startX: 0,
            startY: 0,
            moveX: 0,
            moveY: 0
        };

        // Set initial canvas size
        this.resizeCanvas();
        
        // Handle mobile-specific setup
        if (this.isMobile) {
            this.setupMobileControls();
        }
        
        // Game elements
        this.cube = {
            x: 50,
            y: 50,
            size: 30,
            speed: 5
        };

        // Initialize enemies with default positions
        this.enemies = [
            { x: window.innerWidth - 100, y: window.innerHeight - 100, size: 30, speed: 3, color: '#ff0000', behavior: 'chase' },
            { x: window.innerWidth - 100, y: 100, size: 30, speed: 2, color: '#ff0000', behavior: 'flanker' },
            { x: 100, y: window.innerHeight - 100, size: 30, speed: 2.5, color: '#ff0000', behavior: 'random', direction: Math.random() * Math.PI * 2 }
        ];

        // Logo configuration
        this.logo = {
            text: 'ATRYBUTE',
            x: window.innerWidth / 2 - 100,
            y: window.innerHeight / 2 - 30,
            size: 60,
            gradient: {
                start: '#23CCA3',
                end: '#E30EBE'
            }
        };
        
        // Initialize menu items with default positions
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.25;
        
        this.menuItems = [
            { 
                x: centerX - 150, 
                y: centerY - radius, 
                width: 120, 
                height: 120, 
                content: 'About Us', 
                gradient: {
                    start: '#23CCA3',
                    end: '#E30EBE'
                }
            },
            { 
                x: centerX + radius - 60, 
                y: centerY - 60, 
                width: 120, 
                height: 120, 
                content: 'Blogs', 
                gradient: {
                    start: '#E30EBE',
                    end: '#23CCA3'
                }
            },
            { 
                x: centerX - 150, 
                y: centerY + radius - 120, 
                width: 120, 
                height: 120, 
                content: 'Our Games', 
                gradient: {
                    start: '#23CCA3',
                    end: '#E30EBE'
                }
            },
            { 
                x: centerX - radius - 60, 
                y: centerY - 60, 
                width: 120, 
                height: 120, 
                content: 'Contact', 
                gradient: {
                    start: '#E30EBE',
                    end: '#23CCA3'
                }
            }
        ];

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

        // Paint splashes array
        this.paintSplashes = [];

        // Controls
        this.keys = {
            w: false,
            s: false,
            a: false,
            d: false
        };

        // Event listeners
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Modal setup
        this.modal = document.getElementById('modal');
        this.modalText = document.getElementById('modal-text');
        this.closeBtn = document.querySelector('.close-btn');
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Mobile-specific event listeners
        if (this.isMobile) {
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

    setupMobileControls() {
        const joystickArea = document.querySelector('.joystick-area');
        
        // Touch start
        joystickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchControls.active = true;
            this.touchControls.startX = touch.clientX;
            this.touchControls.startY = touch.clientY;
        });

        // Touch move
        joystickArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.touchControls.active) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - this.touchControls.startX;
            const deltaY = touch.clientY - this.touchControls.startY;
            
            // Calculate movement direction
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = 50; // Maximum joystick movement
            
            if (distance > maxDistance) {
                const angle = Math.atan2(deltaY, deltaX);
                this.touchControls.moveX = Math.cos(angle) * maxDistance;
                this.touchControls.moveY = Math.sin(angle) * maxDistance;
            } else {
                this.touchControls.moveX = deltaX;
                this.touchControls.moveY = deltaY;
            }
        });

        // Touch end
        joystickArea.addEventListener('touchend', () => {
            this.touchControls.active = false;
            this.touchControls.moveX = 0;
            this.touchControls.moveY = 0;
        });

        // Prevent default touch behaviors
        document.addEventListener('touchmove', (e) => {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        }, { passive: false });
    }

    updatePlayerPosition() {
        if (this.isMobile && this.touchControls.active) {
            // Mobile movement
            const sensitivity = 0.1;
            this.cube.x += this.touchControls.moveX * sensitivity;
            this.cube.y += this.touchControls.moveY * sensitivity;
        } else {
            // Keyboard movement
            if (this.keys.w || this.keys.ArrowUp) this.cube.y -= this.cube.speed;
            if (this.keys.s || this.keys.ArrowDown) this.cube.y += this.cube.speed;
            if (this.keys.a || this.keys.ArrowLeft) this.cube.x -= this.cube.speed;
            if (this.keys.d || this.keys.ArrowRight) this.cube.x += this.cube.speed;
        }

        // Keep player within bounds
        this.cube.x = Math.max(0, Math.min(this.canvas.width - this.cube.size, this.cube.x));
        this.cube.y = Math.max(0, Math.min(this.canvas.height - this.cube.size, this.cube.y));
    }

    resizeCanvas() {
        // Get device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        
        // Get display size
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;
        
        // Set canvas size accounting for pixel ratio
        this.canvas.width = displayWidth * dpr;
        this.canvas.height = displayHeight * dpr;
        
        // Scale canvas CSS size
        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;
        
        // Scale context to match pixel ratio
        this.ctx.scale(dpr, dpr);
        
        // Update positions
        this.updateMenuPositions();
    }

    updateMenuPositions() {
        if (!this.canvas || !this.menuItems) return;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) * 0.25;
        
        // Update menu items positions
        this.menuItems.forEach((item, index) => {
            if (!item) return;
            
            switch(index) {
                case 0: // Top
                    item.x = centerX - 150;
                    item.y = centerY - radius;
                    break;
                case 1: // Right
                    item.x = centerX + radius - 60;
                    item.y = centerY - 60;
                    break;
                case 2: // Bottom
                    item.x = centerX - 150;
                    item.y = centerY + radius - 120;
                    break;
                case 3: // Left
                    item.x = centerX - radius - 60;
                    item.y = centerY - 60;
                    break;
            }
        });

        // Update logo position
        if (this.logo) {
            this.logo.x = centerX - 100;
            this.logo.y = centerY - 30;
        }

        // Update enemy positions
        if (this.enemies) {
            this.enemies.forEach(enemy => {
                if (!enemy) return;
            });
            if (this.enemies[0]) {
                this.enemies[0].x = this.canvas.width - 100;
                this.enemies[0].y = this.canvas.height - 100;
            }
            if (this.enemies[1]) {
                this.enemies[1].x = this.canvas.width - 100;
                this.enemies[1].y = 100;
            }
            if (this.enemies[2]) {
                this.enemies[2].x = 100;
                this.enemies[2].y = this.canvas.height - 100;
            }
        }
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
                    item.gradient.start
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
        const modal = document.getElementById('modal');
        const modalText = document.getElementById('modal-text');
        if (modal && modalText) {
            modalText.textContent = content;
            modal.style.display = 'block';
        }
    }

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
        }
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
        if (!this.canvas || !this.ctx) return;

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
        if (this.menuItems) {
            for (const item of this.menuItems) {
                if (!item) continue;
                
                this.ctx.save();
                
                // Create gradient
                const gradient = this.ctx.createLinearGradient(
                    item.x, 
                    item.y, 
                    item.x + item.width, 
                    item.y + item.height
                );
                gradient.addColorStop(0, item.gradient.start);
                gradient.addColorStop(1, item.gradient.end);
                
                // Glow effect
                this.ctx.shadowColor = item.gradient.start;
                this.ctx.shadowBlur = 20;
                
                // Draw item with rounded corners and gradient
                this.ctx.fillStyle = gradient;
                this.roundRect(item.x, item.y, item.width, item.height, 15);
                this.ctx.fill();
                
                // Draw text
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(item.content, item.x + item.width/2, item.y + item.height/2);
                
                this.ctx.restore();
            }
        }

        // Draw logo
        if (this.logo) {
            this.ctx.save();
            
            // Create gradient for logo
            const logoGradient = this.ctx.createLinearGradient(
                this.logo.x - 100, 
                this.logo.y,
                this.logo.x + 100, 
                this.logo.y
            );
            logoGradient.addColorStop(0, this.logo.gradient.start);
            logoGradient.addColorStop(1, this.logo.gradient.end);
            
            this.ctx.fillStyle = logoGradient;
            this.ctx.font = `bold ${this.logo.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Add glow effect
            this.ctx.shadowColor = this.logo.gradient.start;
            this.ctx.shadowBlur = 20;
            
            this.ctx.fillText(this.logo.text, this.logo.x + 100, this.logo.y);
            this.ctx.restore();
        }

        // Draw cube
        if (this.cube) {
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(this.cube.x, this.cube.y, this.cube.size, this.cube.size);
        }

        // Draw enemies
        if (this.enemies) {
            for (const enemy of this.enemies) {
                if (!enemy) continue;
                
                this.ctx.beginPath();
                this.ctx.fillStyle = enemy.color;
                this.ctx.arc(enemy.x + enemy.size/2, enemy.y + enemy.size/2, enemy.size/2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    moveEnemies() {
        for (const enemy of this.enemies) {
            let dx = this.cube.x - enemy.x;
            let dy = this.cube.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Normalize direction
            dx = dx / distance;
            dy = dy / distance;

            switch(enemy.behavior) {
                case 'chase':
                    enemy.x += dx * enemy.speed;
                    enemy.y += dy * enemy.speed;
                    break;
                case 'flanker':
                    enemy.x += dy * enemy.speed;
                    enemy.y -= dx * enemy.speed;
                    break;
                case 'random':
                    if (Math.random() < 0.02) {
                        enemy.direction = Math.random() * Math.PI * 2;
                    }
                    enemy.x += Math.cos(enemy.direction) * enemy.speed;
                    enemy.y += Math.sin(enemy.direction) * enemy.speed;
                    break;
            }

            // Keep enemies within bounds
            enemy.x = Math.max(enemy.size/2, Math.min(this.canvas.width - enemy.size/2, enemy.x));
            enemy.y = Math.max(enemy.size/2, Math.min(this.canvas.height - enemy.size/2, enemy.y));
        }
    }

    gameLoop() {
        this.updatePlayerPosition();
        this.moveEnemies();
        this.checkCollisions();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the window loads
window.addEventListener('load', () => {
    new Game();
});
