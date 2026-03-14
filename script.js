let stepTrackingInterval = null;
let currentSteps = 0;
let isTracking = false;

function startStepTracking() {
  if (isTracking) return;
  
  isTracking = true;
  const startBtn = document.getElementById('start-tracking');
  const stopBtn = document.getElementById('stop-tracking');
  const statusEl = document.getElementById('step-status');
  
  startBtn.style.display = 'none';
  stopBtn.style.display = 'inline-block';
  statusEl.textContent = 'Tracking steps...';
  statusEl.classList.add('tracking');
  
  stepTrackingInterval = setInterval(() => {
    const increment = Math.floor(Math.random() * 5) + 1;
    currentSteps += increment;
    
    updateStepDisplay(currentSteps);
    
    document.getElementById('steps').value = currentSteps;
    
    calculateNEAT();
    
    if (Math.random() < 0.1) {
      setTimeout(() => {
        if (isTracking) {
          const burst = Math.floor(Math.random() * 20) + 10;
          currentSteps += burst;
          updateStepDisplay(currentSteps);
          document.getElementById('steps').value = currentSteps;
          calculateNEAT();
        }
      }, Math.random() * 2000);
    }
  }, 800);
}

function stopStepTracking() {
  if (!isTracking) return;
  
  isTracking = false;
  const startBtn = document.getElementById('start-tracking');
  const stopBtn = document.getElementById('stop-tracking');
  const statusEl = document.getElementById('step-status');
  
  startBtn.style.display = 'inline-block';
  stopBtn.style.display = 'none';
  statusEl.textContent = 'Tracking paused';
  statusEl.classList.remove('tracking');
  
  if (stepTrackingInterval) {
    clearInterval(stepTrackingInterval);
    stepTrackingInterval = null;
  }
}

function resetSteps() {
  stopStepTracking();
  currentSteps = 0;
  updateStepDisplay(0);
  document.getElementById('steps').value = 0;
  document.getElementById('step-status').textContent = 'Ready to track';
  calculateNEAT();
}

function updateStepDisplay(steps) {
  const displayEl = document.getElementById('steps-display');
  displayEl.textContent = steps.toLocaleString();
  displayEl.classList.add('animating');
  setTimeout(() => {
    displayEl.classList.remove('animating');
  }, 300);
}

function toggleStepInputMode(mode) {
  const autoToggle = document.getElementById('auto-toggle');
  const manualToggle = document.getElementById('manual-toggle');
  const autoMode = document.getElementById('auto-track-mode');
  const manualMode = document.getElementById('manual-entry-mode');
  
  if (mode === 'auto') {
    autoToggle.classList.add('active');
    manualToggle.classList.remove('active');
    autoMode.style.display = 'flex';
    manualMode.style.display = 'none';
    if (isTracking) {
      stopStepTracking();
    }
  } else {
    manualToggle.classList.add('active');
    autoToggle.classList.remove('active');
    autoMode.style.display = 'none';
    manualMode.style.display = 'flex';
    if (isTracking) {
      stopStepTracking();
    }
  }
}

function setManualSteps() {
  const manualInput = document.getElementById('manual-steps-input');
  const steps = parseInt(manualInput.value) || 0;
  
  if (steps < 0) {
    alert('Please enter a valid step count');
    return;
  }
  
  currentSteps = steps;
  updateStepDisplay(steps);
  document.getElementById('steps').value = steps;
  calculateNEAT();
}

function calculateNEAT() {
  const deskHours = parseFloat(document.getElementById('desk-hours').value) || 0;
  const standingHours = parseFloat(document.getElementById('standing-hours').value) || 0;
  const steps = parseFloat(document.getElementById('steps').value) || 0;
  const age = parseFloat(document.getElementById('age').value) || 30;

  let neatScore = Math.min(steps / 100, 50);
  
  const standingRatio = standingHours / Math.max(deskHours, 1);
  neatScore += standingRatio * 30;
  
  const ageFactor = Math.max(0, (100 - age) / 100);
  neatScore *= (0.8 + ageFactor * 0.4);
  
  const deskPenalty = Math.max(0, (deskHours - 6) * 2);
  neatScore = Math.max(0, neatScore - deskPenalty);
  
  neatScore = Math.min(100, Math.max(0, Math.round(neatScore)));

  document.getElementById('neat-score').textContent = neatScore;
  
  const statusEl = document.getElementById('neat-status');
  if (neatScore >= 70) {
    statusEl.textContent = 'Excellent! Your NEAT activity is optimal.';
    statusEl.style.color = '#4ade80';
  } else if (neatScore >= 50) {
    statusEl.textContent = 'Good, but there\'s room for improvement.';
    statusEl.style.color = '#fbbf24';
  } else if (neatScore >= 30) {
    statusEl.textContent = 'Below average. Consider more standing time and movement.';
    statusEl.style.color = '#fb923c';
  } else {
    statusEl.textContent = 'Low NEAT score. Prioritize standing desk and micro-movements.';
    statusEl.style.color = '#f87171';
  }
}

const aiResponses = {
  'neat': 'NEAT (Non-Exercise Activity Thermogenesis) is the energy you burn through daily activities like standing, fidgeting, and walking. For desk workers, optimizing NEAT is crucial since you can\'t rely on workouts. Try standing for 2-3 hours daily and taking micro-breaks every 30 minutes.',
  'metabolism': 'Metabolic health for tech workers focuses on maintaining insulin sensitivity and liver function. Key factors: intermittent fasting aligned with your work schedule, minimizing processed foods, and optimizing meal timing around your desk routine.',
  'standing': 'Standing desk protocols: Start with 30-minute intervals. Gradually increase to 2-3 hours daily. The ideal ratio is 60% sitting, 40% standing. Use a timer to remind yourself to switch positions.',
  'nutrition': 'Desk-friendly nutrition: Prioritize protein and healthy fats in your first meal. Avoid high-carb meals during peak work hours (10am-2pm). Consider a liver-friendly approach: minimize fructose, prioritize whole foods, and time meals around your natural energy cycles.',
  'default': 'I can help you with NEAT optimization, metabolic health, standing desk protocols, and desk-friendly nutrition. What would you like to know more about?'
};

function getAIResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('neat') || lowerMessage.includes('activity') || lowerMessage.includes('movement')) {
    return aiResponses.neat;
  } else if (lowerMessage.includes('metabol') || lowerMessage.includes('health') || lowerMessage.includes('insulin')) {
    return aiResponses.metabolism;
  } else if (lowerMessage.includes('standing') || lowerMessage.includes('desk') || lowerMessage.includes('sit')) {
    return aiResponses.standing;
  } else if (lowerMessage.includes('nutrition') || lowerMessage.includes('food') || lowerMessage.includes('diet') || lowerMessage.includes('meal')) {
    return aiResponses.nutrition;
  } else {
    return aiResponses.default;
  }
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  addMessage(message, 'user');
  input.value = '';
  
  setTimeout(() => {
    const response = getAIResponse(message);
    addMessage(response, 'bot');
  }, 500);
}

function handleChatKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

function addMessage(text, sender) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = text;
  
  messageDiv.appendChild(contentDiv);
  messagesContainer.appendChild(messageDiv);
  
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  updateStepDisplay(0);
  
  calculateNEAT();
  
  ['desk-hours', 'standing-hours', 'age'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', calculateNEAT);
    }
  });
  
});

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('section > .container > *');
  sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
  });
});

(function() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeMenu = document.getElementById('theme-menu');
  const themeOptions = document.querySelectorAll('.theme-option');
  const html = document.documentElement;
  
  let currentTheme = localStorage.getItem('theme') || 'light';
  let autoThemeEnabled = localStorage.getItem('autoTheme') === 'true';
  
  function initTheme() {
    if (autoThemeEnabled) {
      currentTheme = getTimeBasedTheme();
      html.setAttribute('data-theme', currentTheme);
      updateThemeUI('auto');
    } else {
      html.setAttribute('data-theme', currentTheme);
      updateThemeUI(currentTheme);
    }
  }
  
  function getTimeBasedTheme() {
    const hour = new Date().getHours();
    return (hour >= 18 || hour < 6) ? 'dark' : 'light';
  }
  
  function updateThemeUI(selectedTheme) {
    themeOptions.forEach(option => {
      option.classList.remove('active');
      if (option.dataset.theme === selectedTheme) {
        option.classList.add('active');
      }
    });
    
    const icon = themeToggle.querySelector('.theme-icon');
    if (selectedTheme === 'auto') {
      icon.textContent = '🕐';
    } else if (selectedTheme === 'dark') {
      icon.textContent = '🌙';
    } else {
      icon.textContent = '☀️';
    }
  }
  
  function applyTheme(theme) {
    if (theme === 'auto') {
      autoThemeEnabled = true;
      localStorage.setItem('autoTheme', 'true');
      currentTheme = getTimeBasedTheme();
      html.setAttribute('data-theme', currentTheme);
      updateThemeUI('auto');
    } else {
      autoThemeEnabled = false;
      localStorage.setItem('autoTheme', 'false');
      localStorage.setItem('theme', theme);
      currentTheme = theme;
      html.setAttribute('data-theme', theme);
      updateThemeUI(theme);
    }
  }
  
  themeToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    themeMenu.classList.toggle('active');
  });
  
  document.addEventListener('click', function(e) {
    if (!themeToggle.contains(e.target) && !themeMenu.contains(e.target)) {
      themeMenu.classList.remove('active');
    }
  });
  
  themeOptions.forEach(option => {
    option.addEventListener('click', function() {
      const theme = this.dataset.theme;
      applyTheme(theme);
      themeMenu.classList.remove('active');
    });
  });
  
  if (autoThemeEnabled) {
    setInterval(function() {
      if (autoThemeEnabled) {
        const timeBasedTheme = getTimeBasedTheme();
        if (timeBasedTheme !== currentTheme) {
          currentTheme = timeBasedTheme;
          html.setAttribute('data-theme', currentTheme);
        }
      }
    }, 60000);
  }
  
  initTheme();
})();
