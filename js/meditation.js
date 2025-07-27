// Глобальные переменные
let currentTimer = null;
let currentSession = null;
let timerDuration = 10 * 60; // 10 минут по умолчанию
let remainingTime = timerDuration;
let isTimerRunning = false;
let currentSounds = {};
let sessionData = {
    todayMinutes: 0,
    streakDays: 0,
    totalMinutes: 0,
    totalSessions: 0,
    weeklyData: [0, 0, 0, 0, 0, 0, 0]
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadProgressData();
    updateProgressDisplay();
    generateWeeklyChart();
    setupNavigation();
    setupSmoothScrolling();
});

// Инициализация приложения
function initializeApp() {
    // Установка активной навигации
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const targetId = this.getAttribute('href');
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Инициализация таймера
    updateTimerDisplay();
    
    // Загрузка звуков
    initializeSounds();
}

// Настройка навигации
function setupNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Закрытие меню при клике на ссылку
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// Плавная прокрутка
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Быстрая медитация
function startQuickMeditation() {
    startSession('breathing', 5);
}

// Прокрутка к секциям
function scrollToSections() {
    document.getElementById('sessions').scrollIntoView({
        behavior: 'smooth'
    });
}

// Запуск сессии медитации
function startSession(type, duration) {
    const modal = document.getElementById('meditation-modal');
    const sessionTitle = document.getElementById('session-title');
    const sessionTime = document.getElementById('session-time');
    const breathText = document.getElementById('breath-text');
    
    // Настройка сессии по типу
    const sessionConfig = {
        breathing: {
            title: 'Дыхательная медитация',
            instructions: ['Вдох', 'Задержка', 'Выдох', 'Пауза']
        },
        mindfulness: {
            title: 'Медитация осознанности',
            instructions: ['Осознавайте', 'Наблюдайте', 'Принимайте', 'Отпускайте']
        },
        'body-scan': {
            title: 'Сканирование тела',
            instructions: ['Расслабьтесь', 'Сканируйте', 'Освобождайтесь', 'Дышите']
        },
        'loving-kindness': {
            title: 'Любящая доброта',
            instructions: ['Любите себя', 'Любите близких', 'Любите всех', 'Излучайте любовь']
        }
    };

    const config = sessionConfig[type] || sessionConfig.breathing;
    
    sessionTitle.textContent = config.title;
    
    // Настройка времени сессии
    currentSession = {
        type: type,
        duration: duration * 60,
        remaining: duration * 60,
        isRunning: true,
        instructions: config.instructions,
        currentInstruction: 0
    };
    
    updateSessionTime();
    modal.classList.add('active');
    
    // Запуск сессии
    startSessionTimer();
    startBreathingAnimation(config.instructions);
}

// Таймер сессии
function startSessionTimer() {
    if (currentSession.timer) {
        clearInterval(currentSession.timer);
    }
    
    currentSession.timer = setInterval(() => {
        if (currentSession.isRunning && currentSession.remaining > 0) {
            currentSession.remaining--;
            updateSessionTime();
            updateSessionProgress();
            
            if (currentSession.remaining <= 0) {
                endSession();
            }
        }
    }, 1000);
}

// Обновление времени сессии
function updateSessionTime() {
    const sessionTime = document.getElementById('session-time');
    const minutes = Math.floor(currentSession.remaining / 60);
    const seconds = currentSession.remaining % 60;
    sessionTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Обновление прогресса сессии
function updateSessionProgress() {
    const progressBar = document.getElementById('session-progress-bar');
    const progress = ((currentSession.duration - currentSession.remaining) / currentSession.duration) * 100;
    progressBar.style.width = `${progress}%`;
}

// Анимация дыхания
function startBreathingAnimation(instructions) {
    const breathText = document.getElementById('breath-text');
    let instructionIndex = 0;
    
    const updateInstruction = () => {
        if (currentSession && currentSession.isRunning) {
            breathText.textContent = instructions[instructionIndex];
            instructionIndex = (instructionIndex + 1) % instructions.length;
        }
    };
    
    updateInstruction();
    currentSession.breathingInterval = setInterval(updateInstruction, 4000);
}

// Переключение воспроизведения/паузы сессии
function toggleSession() {
    const playPauseBtn = document.getElementById('session-play-pause');
    const icon = playPauseBtn.querySelector('i');
    
    if (currentSession.isRunning) {
        currentSession.isRunning = false;
        icon.className = 'fas fa-play';
        if (currentSession.breathingInterval) {
            clearInterval(currentSession.breathingInterval);
        }
    } else {
        currentSession.isRunning = true;
        icon.className = 'fas fa-pause';
        startBreathingAnimation(currentSession.instructions);
    }
}

// Завершение сессии
function endSession() {
    if (currentSession) {
        // Очистка интервалов
        if (currentSession.timer) {
            clearInterval(currentSession.timer);
        }
        if (currentSession.breathingInterval) {
            clearInterval(currentSession.breathingInterval);
        }
        
        // Обновление статистики
        const completedMinutes = Math.ceil((currentSession.duration - currentSession.remaining) / 60);
        updateProgress(completedMinutes);
        
        // Показ уведомления
        showNotification('Сессия медитации завершена! 🧘‍♀️');
        
        // Закрытие модального окна
        setTimeout(() => {
            closeModal();
        }, 1500);
        
        currentSession = null;
    }
}

// Закрытие модального окна
function closeModal() {
    const modal = document.getElementById('meditation-modal');
    modal.classList.remove('active');
    
    if (currentSession) {
        endSession();
    }
}

// Функции таймера
function setTimer(minutes) {
    timerDuration = minutes * 60;
    remainingTime = timerDuration;
    
    // Обновление активной кнопки
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    updateTimerDisplay();
    resetTimerProgress();
}

function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        
        const startBtn = document.getElementById('start-timer');
        const pauseBtn = document.getElementById('pause-timer');
        
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'flex';
        
        currentTimer = setInterval(() => {
            if (remainingTime > 0) {
                remainingTime--;
                updateTimerDisplay();
                updateTimerProgress();
            } else {
                // Таймер завершен
                clearInterval(currentTimer);
                isTimerRunning = false;
                
                const completedMinutes = Math.ceil(timerDuration / 60);
                updateProgress(completedMinutes);
                
                showNotification('Время медитации истекло! 🔔');
                resetTimer();
            }
        }, 1000);
    }
}

function pauseTimer() {
    if (isTimerRunning) {
        isTimerRunning = false;
        clearInterval(currentTimer);
        
        const startBtn = document.getElementById('start-timer');
        const pauseBtn = document.getElementById('pause-timer');
        
        startBtn.style.display = 'flex';
        pauseBtn.style.display = 'none';
        
        startBtn.querySelector('span') ? startBtn.querySelector('span').textContent = 'Продолжить' : null;
    }
}

function resetTimer() {
    isTimerRunning = false;
    if (currentTimer) {
        clearInterval(currentTimer);
    }
    
    remainingTime = timerDuration;
    
    const startBtn = document.getElementById('start-timer');
    const pauseBtn = document.getElementById('pause-timer');
    
    startBtn.style.display = 'flex';
    pauseBtn.style.display = 'none';
    
    const startText = startBtn.querySelector('span');
    if (startText) startText.textContent = 'Начать';
    
    updateTimerDisplay();
    resetTimerProgress();
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimerProgress() {
    const progressCircle = document.getElementById('timer-progress');
    const progress = ((timerDuration - remainingTime) / timerDuration) * 283;
    progressCircle.style.strokeDashoffset = 283 - progress;
}

function resetTimerProgress() {
    const progressCircle = document.getElementById('timer-progress');
    progressCircle.style.strokeDashoffset = 283;
}

// Функции звуков
function initializeSounds() {
    // Создание объектов Audio для каждого звука
    const soundUrls = {
        rain: 'https://www.soundjay.com/misc/sounds/rain-01.wav',
        ocean: 'https://www.soundjay.com/misc/sounds/ocean-01.wav',
        forest: 'https://www.soundjay.com/misc/sounds/forest-01.wav',
        birds: 'https://www.soundjay.com/misc/sounds/birds-01.wav',
        fire: 'https://www.soundjay.com/misc/sounds/fire-01.wav',
        bells: 'https://www.soundjay.com/misc/sounds/bells-01.wav'
    };
    
    // Для демонстрации создаем фиктивные звуки с Web Audio API
    Object.keys(soundUrls).forEach(soundType => {
        currentSounds[soundType] = {
            isPlaying: false,
            audio: null
        };
    });
}

function toggleSound(soundType) {
    const soundBtn = document.querySelector(`[data-sound="${soundType}"] .sound-btn`);
    const icon = soundBtn.querySelector('i');
    
    if (currentSounds[soundType].isPlaying) {
        // Остановить звук
        if (currentSounds[soundType].audio) {
            currentSounds[soundType].audio.pause();
            currentSounds[soundType].audio = null;
        }
        currentSounds[soundType].isPlaying = false;
        soundBtn.classList.remove('playing');
        icon.className = 'fas fa-play';
    } else {
        // Запустить звук (имитация)
        currentSounds[soundType].isPlaying = true;
        soundBtn.classList.add('playing');
        icon.className = 'fas fa-pause';
        
        // Создание простого тона для демонстрации
        createDemoSound(soundType);
    }
}

function createDemoSound(soundType) {
    // Простая имитация звуков с помощью Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Разные частоты для разных звуков
        const frequencies = {
            rain: 200,
            ocean: 100,
            forest: 300,
            birds: 800,
            fire: 150,
            bells: 440
        };
        
        oscillator.frequency.setValueAtTime(frequencies[soundType] || 200, audioContext.currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        oscillator.start();
        
        // Остановка через 30 секунд для демонстрации
        setTimeout(() => {
            if (currentSounds[soundType].isPlaying) {
                oscillator.stop();
                toggleSound(soundType);
            }
        }, 30000);
        
        currentSounds[soundType].audio = oscillator;
    } catch (error) {
        console.log('Web Audio API не поддерживается');
    }
}

// Функции прогресса
function updateProgress(minutes) {
    sessionData.todayMinutes += minutes;
    sessionData.totalMinutes += minutes;
    sessionData.totalSessions += 1;
    
    // Обновление недельных данных (текущий день)
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1; // Преобразование воскресенья
    sessionData.weeklyData[dayIndex] += minutes;
    
    saveProgressData();
    updateProgressDisplay();
    generateWeeklyChart();
}

function loadProgressData() {
    const saved = localStorage.getItem('meditationProgress');
    if (saved) {
        sessionData = { ...sessionData, ...JSON.parse(saved) };
    }
    
    // Проверка и обновление streak
    updateStreak();
}

function saveProgressData() {
    localStorage.setItem('meditationProgress', JSON.stringify(sessionData));
}

function updateStreak() {
    const lastSession = localStorage.getItem('lastMeditationDate');
    const today = new Date().toDateString();
    
    if (lastSession) {
        const lastDate = new Date(lastSession);
        const todayDate = new Date(today);
        const diffTime = todayDate - lastDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            // Продолжение streak
            sessionData.streakDays += 1;
        } else if (diffDays > 1) {
            // Streak прерван
            sessionData.streakDays = 1;
        }
    } else {
        sessionData.streakDays = 1;
    }
    
    localStorage.setItem('lastMeditationDate', today);
}

function updateProgressDisplay() {
    document.getElementById('today-minutes').textContent = sessionData.todayMinutes;
    document.getElementById('streak-days').textContent = sessionData.streakDays;
    document.getElementById('total-minutes').textContent = sessionData.totalMinutes;
    document.getElementById('total-sessions').textContent = sessionData.totalSessions;
}

function generateWeeklyChart() {
    const chartContainer = document.getElementById('weekly-chart');
    chartContainer.innerHTML = '';
    
    const maxValue = Math.max(...sessionData.weeklyData, 1);
    
    sessionData.weeklyData.forEach((minutes, index) => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        const height = (minutes / maxValue) * 100;
        bar.style.height = `${height}%`;
        bar.title = `${minutes} минут`;
        
        chartContainer.appendChild(bar);
    });
}

// Функция показа уведомлений
function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    notificationText.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Обработка событий клавиатуры
document.addEventListener('keydown', function(e) {
    // Пробел для паузы/воспроизведения
    if (e.code === 'Space') {
        e.preventDefault();
        if (currentSession) {
            toggleSession();
        } else if (isTimerRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    }
    
    // Escape для закрытия модального окна
    if (e.code === 'Escape') {
        closeModal();
    }
});

// Обработка закрытия модального окна по клику вне его
document.getElementById('meditation-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Функции для анимации при прокрутке
function animateOnScroll() {
    const elements = document.querySelectorAll('.session-card, .stat-card, .sound-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Запуск анимации при загрузке
document.addEventListener('DOMContentLoaded', animateOnScroll);

// Обновление активной навигации при прокрутке
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Сброс данных (для тестирования)
function resetProgress() {
    if (confirm('Вы уверены, что хотите сбросить весь прогресс?')) {
        sessionData = {
            todayMinutes: 0,
            streakDays: 0,
            totalMinutes: 0,
            totalSessions: 0,
            weeklyData: [0, 0, 0, 0, 0, 0, 0]
        };
        localStorage.removeItem('meditationProgress');
        localStorage.removeItem('lastMeditationDate');
        updateProgressDisplay();
        generateWeeklyChart();
        showNotification('Прогресс сброшен');
    }
}

// Экспорт функций для глобального доступа
window.startQuickMeditation = startQuickMeditation;
window.scrollToSections = scrollToSections;
window.startSession = startSession;
window.toggleSession = toggleSession;
window.endSession = endSession;
window.closeModal = closeModal;
window.setTimer = setTimer;
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.resetTimer = resetTimer;
window.toggleSound = toggleSound;
window.resetProgress = resetProgress;