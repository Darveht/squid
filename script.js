class SquidGameLogin {
    constructor() {
        this.currentScreen = 'loading';
        this.playerName = '';
        this.speechSynthesis = window.speechSynthesis;
        this.audioContext = null;
        this.backgroundMusic = null;
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.scanProgress = 0;
        this.isScanComplete = false;
        
        this.init();
    }

    init() {
        console.log('Face detection library loaded (simulated)');
        this.setupElements();
        this.setupEventListeners();
        this.startLoadingSequence();
        this.initializeAudio();
        this.preventZoom();
        
        // Mejorar experiencia en móviles
        document.body.style.touchAction = 'manipulation';
        document.body.style.userSelect = 'none';
    }

    setupElements() {
        this.screens = {
            loading: document.getElementById('loadingScreen'),
            name: document.getElementById('nameScreen'),
            scan: document.getElementById('scanScreen'),
            success: document.getElementById('successScreen'),
            rotate: document.getElementById('rotateScreen'),
            tutorial: document.getElementById('tutorialScreen'),
            tugOfWar: document.getElementById('tugOfWarScreen')
        };

        this.elements = {
            playerNameInput: document.getElementById('playerName'),
            nameSubmitBtn: document.getElementById('nameSubmit'),
            video: document.getElementById('video'),
            canvas: document.getElementById('canvas'),
            scanStatus: document.getElementById('scanStatus'),
            scanProgressBar: document.getElementById('scanProgressBar'),
            instruction: document.getElementById('instruction'),
            playerNameDisplay: document.getElementById('playerNameDisplay'),
            startGameBtn: document.getElementById('startGame')
        };
    }

    setupEventListeners() {
        // Input del nombre - Arreglado para móviles
        this.elements.playerNameInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            this.elements.nameSubmitBtn.disabled = value.length < 2;
            
            if (value.length > 0) {
                this.playTypingSound();
            }
        });

        // Prevenir que el teclado desplace la pantalla
        this.elements.playerNameInput.addEventListener('focus', () => {
            setTimeout(() => {
                this.elements.playerNameInput.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 300);
        });

        // Botón de continuar al escaneo
        this.elements.nameSubmitBtn.addEventListener('click', () => {
            this.playerName = this.elements.playerNameInput.value.trim();
            if (this.playerName.length >= 2) {
                this.playButtonSound();
                this.speak(`Bienvenido ${this.playerName}. Procediendo al escaneo biométrico.`);
                setTimeout(() => this.showScreen('scan'), 500);
            }
        });

        // Botón de iniciar juego
        this.elements.startGameBtn.addEventListener('click', () => {
            this.playButtonSound();
            this.speak(`${this.playerName}, preparándose para el tutorial del juego.`);
            this.checkOrientation();
        });

        // Botón de tutorial
        const startTutorialBtn = document.getElementById('startTutorial');
        if (startTutorialBtn) {
            startTutorialBtn.addEventListener('click', () => {
                this.playButtonSound();
                this.speak('Tutorial completado. Iniciando Juego de la Cuerda');
                setTimeout(() => {
                    this.showScreen('tugOfWar');
                    this.initializeTugOfWar();
                }, 1000);
            });
        }

        // Enter en el input de nombre
        this.elements.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.elements.nameSubmitBtn.disabled) {
                this.elements.nameSubmitBtn.click();
            }
        });

        // Detectar cambios de orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Detectar cambios de tamaño de pantalla
        window.addEventListener('resize', () => {
            this.handleOrientationChange();
        });
    }

    async initializeAudio() {
        try {
            // Intentar inicializar el contexto de audio
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Intentar reproducir música de fondo desde YouTube iframe
            const youtubeFrame = document.getElementById('squidGameAudio');
            if (youtubeFrame) {
                console.log('Trying YouTube audio');
            }
            
            // Audio de respaldo usando Web Audio API
            this.createBackgroundAmbient();
            
        } catch (error) {
            console.log('Audio autoplay prevented by browser:', error);
        }
    }

    createBackgroundAmbient() {
        if (!this.audioContext) return;
        
        try {
            // Crear sonido ambiente simple
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime);
            
            oscillator.start();
            
            // Crear efecto de fade in/out
            setInterval(() => {
                if (this.audioContext && gainNode.gain) {
                    const time = this.audioContext.currentTime;
                    gainNode.gain.exponentialRampToValueAtTime(0.04, time + 2);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 4);
                }
            }, 4000);
            
        } catch (error) {
            console.log('Error creando ambiente de audio:', error);
        }
    }

    playButtonSound() {
        this.playSound(800, 0.1, 0.1, 'square');
    }

    playTypingSound() {
        this.playSound(400 + Math.random() * 200, 0.05, 0.05, 'sine');
    }

    playErrorSound() {
        this.playSound(200, 0.2, 0.3, 'sawtooth');
    }

    playSuccessSound() {
        // Melodía de éxito
        const notes = [523, 659, 784, 1047]; // C, E, G, C
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playSound(freq, 0.1, 0.2, 'sine');
            }, i * 150);
        });
    }

    playScanSound() {
        this.playSound(1000, 0.05, 0.1, 'sine');
    }

    playSound(frequency, volume, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
        } catch (error) {
            console.log('Error reproduciendo sonido:', error);
        }
    }

    speak(text) {
        // Síntesis de voz deshabilitada por preferencia del usuario
        console.log('Mensaje del sistema:', text);
    }

    startLoadingSequence() {
        this.showScreen('loading');
        
        // Simular carga progresiva
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    this.speak('Sistema de juegos inicializado. Bienvenido al Juego del Calamar.');
                    setTimeout(() => this.showScreen('name'), 1000);
                }, 500);
            }
        }, 300);
    }

    showScreen(screenName) {
        // Ocultar todas las pantallas
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });

        // Mostrar pantalla solicitada
        this.screens[screenName].classList.add('active');
        this.currentScreen = screenName;

        // Acciones específicas por pantalla
        if (screenName === 'name') {
            setTimeout(() => {
                this.elements.playerNameInput.focus();
            }, 500);
        } else if (screenName === 'scan') {
            this.initializeCamera();
        } else if (screenName === 'success') {
            this.elements.playerNameDisplay.textContent = this.playerName;
            this.playSuccessSound();
        }
    }

    async initializeCamera() {
        try {
            this.updateScanStatus('Iniciando cámara...');
            
            // Solicitar acceso a la cámara
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });

            this.elements.video.srcObject = this.stream;
            this.elements.video.play();

            this.updateScanStatus('Cámara activada - Posicione su rostro');
            this.updateInstruction('Mantenga la cabeza quieta y mire directamente a la cámara');

            // Esperar a que el video esté listo
            this.elements.video.addEventListener('loadedmetadata', () => {
                this.startFaceDetection();
            });

        } catch (error) {
            console.log('Error accediendo a la cámara:', error);
            this.handleCameraError();
        }
    }

    handleCameraError() {
        this.updateScanStatus('Error de cámara - Continuando sin escaneo');
        this.updateInstruction('No se pudo acceder a la cámara. El juego continuará automáticamente.');
        
        this.playErrorSound();
        
        // Continuar automáticamente después de 3 segundos
        setTimeout(() => {
            this.speak('Escaneo completado mediante métodos alternativos.');
            this.completeScanning();
        }, 3000);
    }

    startFaceDetection() {
        this.updateScanStatus('Escaneando rostro...');
        this.scanProgress = 0;
        
        // Simular detección facial con progreso
        const scanInterval = setInterval(() => {
            if (this.currentScreen !== 'scan') {
                clearInterval(scanInterval);
                return;
            }

            this.scanProgress += Math.random() * 8 + 2;
            this.elements.scanProgressBar.style.width = Math.min(this.scanProgress, 100) + '%';
            
            this.playScanSound();
            
            // Simular diferentes estados de detección
            if (this.scanProgress < 30) {
                this.updateInstruction('Detectando rostro...');
            } else if (this.scanProgress < 60) {
                this.updateInstruction('Analizando características faciales...');
            } else if (this.scanProgress < 90) {
                this.updateInstruction('Verificando identidad...');
            } else if (this.scanProgress >= 100) {
                clearInterval(scanInterval);
                this.updateInstruction('Escaneo completado');
                this.updateScanStatus('Escaneo biométrico completado');
                
                // Tomar foto final
                this.capturePhoto();
                
                setTimeout(() => {
                    this.speak('Escaneo biométrico completado exitosamente.');
                    this.completeScanning();
                }, 1500);
            }
        }, 200);
    }

    capturePhoto() {
        if (!this.elements.video.videoWidth) return;
        
        // Configurar canvas para captura
        this.elements.canvas.width = this.elements.video.videoWidth;
        this.elements.canvas.height = this.elements.video.videoHeight;
        
        const ctx = this.elements.canvas.getContext('2d');
        
        // Capturar frame actual del video
        ctx.drawImage(this.elements.video, 0, 0);
        
        // Simular efecto de flash
        this.createFlashEffect();
        
        console.log('Foto capturada para el participante:', this.playerName);
    }

    createFlashEffect() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: white;
            z-index: 9999;
            opacity: 0.8;
            pointer-events: none;
        `;
        
        document.body.appendChild(flash);
        
        setTimeout(() => {
            flash.style.transition = 'opacity 0.2s ease';
            flash.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(flash);
            }, 200);
        }, 100);
        
        // Sonido de flash
        this.playSound(1200, 0.1, 0.1, 'sine');
    }

    completeScanning() {
        // Detener cámara
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        setTimeout(() => {
            this.showScreen('success');
        }, 1000);
    }

    updateScanStatus(status) {
        this.elements.scanStatus.textContent = status;
    }

    updateInstruction(instruction) {
        this.elements.instruction.textContent = instruction;
    }

    checkOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile && !isLandscape) {
            this.showScreen('rotate');
            this.speak('Por favor gira tu teléfono horizontalmente para una mejor experiencia.');
        } else {
            this.showScreen('tutorial');
        }
    }

    handleOrientationChange() {
        if (this.currentScreen === 'rotate') {
            const isLandscape = window.innerWidth > window.innerHeight;
            if (isLandscape) {
                this.playSuccessSound();
                this.speak('Perfecto. Ahora aprenderemos a jugar.');
                setTimeout(() => {
                    this.showScreen('tutorial');
                }, 1000);
            }
        }
    }

    // Función para hacer vibrar el teléfono (si está disponible)
    vibrate(pattern = [100]) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    // Mejorar la experiencia en móviles
    preventZoom() {
        document.addEventListener('touchmove', (e) => {
            if (e.scale !== 1) {
                e.preventDefault();
            }
        }, { passive: false });
    }
}

// Inicializar el juego cuando la página carga
document.addEventListener('DOMContentLoaded', () => {
    // Permitir interacción de usuario para activar audio
    document.addEventListener('click', function enableAudio() {
        document.removeEventListener('click', enableAudio);
        // Esto ayuda a desbloquear el audio en algunos navegadores
    }, { once: true });
    
    // Inicializar juego
    new SquidGameLogin();
});

// Función para manejar errores globales
window.addEventListener('error', (e) => {
    console.log('Error capturado:', e.message);
});



    // Tug of War Game Logic
    initializeTugOfWar() {
        this.tugOfWarState = {
            leftStrength: 50,
            rightStrength: 50,
            gameTime: 180, // 3 minutes
            isPlaying: false,
            tapCount: 0,
            lastTap: 0
        };
        
        this.speak('¡Juego de la Cuerda iniciado! Toca rápidamente para ganar fuerza.');
        this.startTugOfWarGame();
    }
    
    startTugOfWarGame() {
        this.tugOfWarState.isPlaying = true;
        const leftStrengthBar = document.getElementById('leftStrength');
        const rightStrengthBar = document.getElementById('rightStrength');
        const gameTimer = document.getElementById('gameTimer');
        
        // Add tap event listener
        document.addEventListener('click', this.handleTugTap.bind(this));
        document.addEventListener('touchstart', this.handleTugTap.bind(this));
        
        // Game timer
        const gameInterval = setInterval(() => {
            if (!this.tugOfWarState.isPlaying) {
                clearInterval(gameInterval);
                return;
            }
            
            this.tugOfWarState.gameTime--;
            const minutes = Math.floor(this.tugOfWarState.gameTime / 60);
            const seconds = this.tugOfWarState.gameTime % 60;
            gameTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // AI opponent logic
            if (Math.random() < 0.3) {
                this.tugOfWarState.rightStrength += Math.random() * 2;
                this.tugOfWarState.leftStrength -= Math.random() * 1;
            }
            
            // Update strength bars
            leftStrengthBar.style.width = `${this.tugOfWarState.leftStrength}%`;
            rightStrengthBar.style.width = `${this.tugOfWarState.rightStrength}%`;
            
            // Check win conditions
            if (this.tugOfWarState.leftStrength >= 90) {
                this.endTugOfWar('player');
                clearInterval(gameInterval);
            } else if (this.tugOfWarState.rightStrength >= 90) {
                this.endTugOfWar('ai');
                clearInterval(gameInterval);
            } else if (this.tugOfWarState.gameTime <= 0) {
                this.endTugOfWar('time');
                clearInterval(gameInterval);
            }
            
            // Animate rope based on strength
            this.animateRope();
            
        }, 1000);
    }
    
    handleTugTap(event) {
        if (!this.tugOfWarState.isPlaying) return;
        
        event.preventDefault();
        
        const currentTime = Date.now();
        const timeSinceLastTap = currentTime - this.tugOfWarState.lastTap;
        
        if (timeSinceLastTap < 100) return; // Prevent spam
        
        this.tugOfWarState.lastTap = currentTime;
        this.tugOfWarState.tapCount++;
        
        // Calculate strength increase based on tap speed
        const strengthIncrease = Math.min(3, Math.random() * 2 + 1);
        this.tugOfWarState.leftStrength += strengthIncrease;
        this.tugOfWarState.rightStrength -= strengthIncrease * 0.5;
        
        // Keep within bounds
        this.tugOfWarState.leftStrength = Math.max(0, Math.min(100, this.tugOfWarState.leftStrength));
        this.tugOfWarState.rightStrength = Math.max(0, Math.min(100, this.tugOfWarState.rightStrength));
        
        // Play tap sound
        this.playSound(400 + Math.random() * 200, 0.1, 0.1, 'sine');
        
        // Vibrate on mobile
        this.vibrate([50]);
        
        // Visual feedback
        this.createTapEffect(event.clientX || event.touches[0].clientX, 
                            event.clientY || event.touches[0].clientY);
    }
    
    createTapEffect(x, y) {
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 30px;
            height: 30px;
            background: radial-gradient(circle, #f8bbd9 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
            animation: tapRipple 0.5s ease-out forwards;
        `;
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            document.body.removeChild(effect);
        }, 500);
    }
    
    animateRope() {
        const ropeSegments = document.querySelectorAll('.rope-segment');
        const strength = this.tugOfWarState.leftStrength - this.tugOfWarState.rightStrength;
        
        ropeSegments.forEach((segment, index) => {
            const offset = (strength / 100) * 20; // Max 20px movement
            segment.style.transform = `translateY(${Math.sin(index * 0.5) * 2}px) translateX(${offset}px)`;
        });
    }
    
    endTugOfWar(winner) {
        this.tugOfWarState.isPlaying = false;
        
        // Remove event listeners
        document.removeEventListener('click', this.handleTugTap);
        document.removeEventListener('touchstart', this.handleTugTap);
        
        let message = '';
        if (winner === 'player') {
            message = '¡Felicidades! Has ganado el Juego de la Cuerda.';
            this.playSuccessSound();
        } else if (winner === 'ai') {
            message = 'El equipo contrario ha ganado. ¡Inténtalo de nuevo!';
            this.playErrorSound();
        } else {
            message = 'Se acabó el tiempo. Es un empate.';
            this.playSound(500, 0.2, 0.5, 'sine');
        }
        
        this.speak(message);
        
        setTimeout(() => {
            alert(message + ' El juego se reiniciará.');
            this.showScreen('tutorial');
        }, 2000);
    }
