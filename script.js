/**
 * BrightMind - Core Application Script
 * Handles shared functionality across all pages
 */

// Global Variables
let currentUser = null;
let notificationInterval = null;

// Initialize application
function initApp() {
    checkAuthState();
    setupFloatingCompanion();
    setupServiceWorker();
    setupNotifications();
}

// Check authentication state
function checkAuthState() {
    const currentUserEmail = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (currentUserEmail) {
        currentUser = users.find(user => user.email === currentUserEmail);
        
        if (!currentUser) {
            // Invalid user, clear session
            localStorage.removeItem('currentUser');
            if (window.location.pathname !== '/login.html') {
                window.location.href = 'login.html';
            }
        }
    } else if (!['/login.html', '/register.html'].includes(window.location.pathname)) {
        window.location.href = 'login.html';
    }
}

// Floating Companion
function setupFloatingCompanion() {
    const companion = document.getElementById('companion');
    if (!companion) return;

    const messages = [
        "Hello! How can I help you today?",
        "Remember to take breaks while studying!",
        "Your health is important for learning",
        "Check your progress regularly"
    ];

    // Show random message on hover
    companion.addEventListener('mouseenter', () => {
        const message = messages[Math.floor(Math.random() * messages.length)];
        companion.setAttribute('title', message);
    });

    // Wave animation on page load
    companion.style.animation = 'wave 1s';
}

// Service Worker Registration
function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
}

// Notification System
function setupNotifications() {
    // Request permission if not already determined
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }

    // Schedule regular notifications if enabled
    const checkNotifications = () => {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === currentUser?.email);
        
        if (user?.notificationSettings?.enabled) {
            // Check for health reminders
            if (user.notificationSettings.remindHealth) {
                const lastHealthCheck = user.healthData?.[user.healthData.length - 1]?.date;
                if (!lastHealthCheck || new Date() - new Date(lastHealthCheck) > 86400000) {
                    showNotification("Don't forget to log your health data today!");
                }
            }

            // Check for study reminders
            if (user.notificationSettings.remindStudy) {
                const now = new Date();
                const currentHour = now.getHours();
                if (currentHour >= 8 && currentHour <= 22) {
                    showNotification("Time for a focused study session!");
                }
            }
        }
    };

    // Check every hour
    notificationInterval = setInterval(checkNotifications, 3600000);
    checkNotifications();
}

// Show notification
function showNotification(message) {
    if (Notification.permission === 'granted') {
        new Notification('BrightMind Reminder', { body: message });
    }
}

// IQ Test Utilities
function calculateIQScore(score, totalQuestions, timeTaken) {
    // Base score (0-100)
    let iqScore = Math.round((score / totalQuestions) * 100);
    
    // Time adjustment (faster completion gives bonus)
    const timeBonus = Math.max(0, 10 - (timeTaken / 60)); // Up to 10 points
    iqScore = Math.min(100, iqScore + timeBonus);
    
    return iqScore;
}

// Health Data Analysis
function analyzeHealthData(healthData) {
    if (!healthData || healthData.length === 0) return null;
    
    const latest = healthData[healthData.length - 1];
    const avgStress = healthData.reduce((sum, data) => sum + data.stressLevel, 0) / healthData.length;
    const avgSleep = healthData.reduce((sum, data) => sum + data.sleepHours, 0) / healthData.length;
    
    return {
        stressLevel: latest.stressLevel,
        sleepQuality: latest.sleepHours >= 7 ? 'Good' : 'Poor',
        energyLevel: latest.energyLevel,
        overallHealth: Math.round((latest.energyLevel * 2 + (10 - latest.stressLevel) + latest.sleepHours) / 4),
        trends: {
            stressTrend: avgStress > latest.stressLevel ? 'Improving' : 'Declining',
            sleepTrend: avgSleep > latest.sleepHours ? 'Declining' : 'Improving'
        }
    };
}

// Schedule Management
function getCurrentSchedule() {
    if (!currentUser?.schedule) return [];
    
    const now = new Date();
    const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    return currentUser.schedule.filter(item => {
        return item.days.includes(day) && 
               parseInt(item.startTime.replace(':', '')) <= currentTime &&
               parseInt(item.endTime.replace(':', '')) >= currentTime;
    });
}

// Document Processing for AI Tutor
async function processDocument(file) {
    return new Promise((resolve) => {
        // Mock processing - in a real app this would call an API
        setTimeout(() => {
            const mockSummary = `This is a simplified summary of the document "${file.name}". 
                The document appears to contain approximately ${file.size / 1000}KB of information. 
                Key concepts would be extracted here in a real implementation.`;
            resolve(mockSummary);
        }, 2000);
    });
}

// Initialize app when DOM loads
document.addEventListener('DOMContentLoaded', initApp);

// Clean up when window closes
window.addEventListener('beforeunload', () => {
    if (notificationInterval) {
        clearInterval(notificationInterval);
    }
});