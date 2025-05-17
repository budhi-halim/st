/**
 * Recipe Calculator
 */

// Global Constants
const CONSTANTS = {
    // Calculation Constants
    SOY_MULTIPLIER: 180,
    WATER_MULTIPLIER: 0.02,
    MOLD_MULTIPLIER_1: 0.8,
    MOLD_MULTIPLIER_2: 300,
    FLOUR_MULTIPLIER: 2/3,
    
    // Default Values
    DEFAULT_ROLL: 22,
    
    // Button Control Settings - General
    BUTTON_HOLD_DELAY: 500,       // ms before rapid change starts
    BUTTON_FAST_DELAY: 1500,      // ms before very fast change starts
    
    // Button Control Settings - ROLL
    ROLL_SLOW_INTERVAL: 100,         // ms between changes at first speed for ROLL
    ROLL_FAST_INTERVAL: 20,          // ms between changes at fastest speed for ROLL
    ROLL_SLOW_INCREMENT: 1,          // increment value at slow speed for ROLL
    ROLL_FAST_INCREMENT: 1,          // increment value at fast speed for ROLL
    
    // Button Control Settings - SOY
    SOY_SLOW_INTERVAL: 1,
    SOY_FAST_INTERVAL: 1,
    SOY_SLOW_INCREMENT: 1,
    SOY_FAST_INCREMENT: 10,
    
    // Input Limits
    MIN_VALUE: 1,
    MAX_VALUE: 1000000,
    
    // Debounce Timing
    TYPING_DEBOUNCE: 320, // ms
};

// DOM Elements
const elements = {
    rollInput: document.getElementById('roll-value'),
    soyInput: document.getElementById('soy-value'),
    waterResult: document.getElementById('water-result'),
    moldResult: document.getElementById('mold-result'),
    flourResult: document.getElementById('flour-result'),
    weightResult: document.getElementById('weight-result'),
    calculateBtn: document.getElementById('calculate-btn'),
    controlButtons: document.querySelectorAll('.control-btn'),
    popup: document.getElementById('popup-notification')
};

// Debounce helper
function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Initialize the application
function initApp() {
    setViewportHeight();
    elements.rollInput.value = CONSTANTS.DEFAULT_ROLL;
    elements.soyInput.value = CONSTANTS.DEFAULT_ROLL * CONSTANTS.SOY_MULTIPLIER;
    elements.waterResult.textContent = "-";
    elements.moldResult.textContent = "-";
    elements.flourResult.textContent = "-";
    elements.weightResult.textContent = "-";

    // For manual typing, debounce the soy update
    elements.rollInput.addEventListener('input', validateNumberInput);
    elements.rollInput.addEventListener('input', debouncedSoySyncOnTyping);
    elements.soyInput.addEventListener('input', validateNumberInput);
    elements.calculateBtn.addEventListener('click', handleCalculate);
    setupControlButtons();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
}

function setViewportHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    setTimeout(() => {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }, 100);
}

// Only numeric input, empty is allowed for typing
function validateNumberInput() {
    let value = this.value.replace(/[^0-9]/g, '');
    this.value = value;
}

// Debounced soy update on manual roll typing
const debouncedSoySyncOnTyping = debounce(function () {
    // Only update soy if roll is not empty or invalid
    let rollVal = parseInt(elements.rollInput.value);
    if (elements.rollInput === document.activeElement) { // Only if user is typing
        if (!isNaN(rollVal) && rollVal >= CONSTANTS.MIN_VALUE && rollVal <= CONSTANTS.MAX_VALUE) {
            elements.soyInput.value = rollVal * CONSTANTS.SOY_MULTIPLIER;
        }
    }
}, CONSTANTS.TYPING_DEBOUNCE);

// Show custom popup notification in the center of the app
function showPopup(message) {
    elements.popup.textContent = message;
    elements.popup.style.display = 'block';
    elements.popup.classList.add('show');
    elements.popup.classList.remove('fadeout');
    setTimeout(() => {
        elements.popup.classList.add('fadeout');
    }, 1200);
    setTimeout(() => {
        elements.popup.style.display = 'none';
        elements.popup.classList.remove('show','fadeout');
    }, 1700);
}

function getButtonSettings(targetId) {
    if (targetId === 'roll-value') {
        return {
            slowInterval: CONSTANTS.ROLL_SLOW_INTERVAL,
            fastInterval: CONSTANTS.ROLL_FAST_INTERVAL,
            slowIncrement: CONSTANTS.ROLL_SLOW_INCREMENT,
            fastIncrement: CONSTANTS.ROLL_FAST_INCREMENT
        };
    } else if (targetId === 'soy-value') {
        return {
            slowInterval: CONSTANTS.SOY_SLOW_INTERVAL,
            fastInterval: CONSTANTS.SOY_FAST_INTERVAL,
            slowIncrement: CONSTANTS.SOY_SLOW_INCREMENT,
            fastIncrement: CONSTANTS.SOY_FAST_INCREMENT
        };
    }
}

function setupControlButtons() {
    elements.controlButtons.forEach(button => {
        let intervalId = null;
        let timeoutId = null;
        let fastModeTimeoutId = null;
        let isFastMode = false;
        const targetId = button.dataset.target;

        const handleButtonAction = (increment) => {
            const targetInput = document.getElementById(targetId);
            const isIncrease = button.classList.contains('increase');
            let value = parseInt(targetInput.value);

            if (isNaN(value)) {
                value = isIncrease ? CONSTANTS.MIN_VALUE : CONSTANTS.MAX_VALUE;
            }
            
            if (isIncrease) {
                if (value < CONSTANTS.MAX_VALUE) {
                    value += increment;
                } else {
                    value = CONSTANTS.MAX_VALUE;
                }
            } else {
                if (value > CONSTANTS.MIN_VALUE) {
                    value -= increment;
                } else {
                    value = CONSTANTS.MIN_VALUE;
                }
            }

            value = Math.max(CONSTANTS.MIN_VALUE, Math.min(value, CONSTANTS.MAX_VALUE));
            targetInput.value = value; // Never blank via button logic

            // Immediately sync soy when roll is changed by button
            if (targetId === 'roll-value') {
                elements.soyInput.value = value * CONSTANTS.SOY_MULTIPLIER;
            }
        };

        const startRapidChanges = () => {
            const settings = getButtonSettings(targetId);
            if (intervalId) clearInterval(intervalId);
            intervalId = setInterval(() => {
                handleButtonAction(settings.slowIncrement);
            }, settings.slowInterval);
            fastModeTimeoutId = setTimeout(() => {
                clearInterval(intervalId);
                isFastMode = true;
                intervalId = setInterval(() => {
                    handleButtonAction(settings.fastIncrement);
                }, settings.fastInterval);
            }, CONSTANTS.BUTTON_FAST_DELAY);
        };

        const stopRapidChanges = () => {
            if (intervalId) clearInterval(intervalId);
            if (timeoutId) clearTimeout(timeoutId);
            if (fastModeTimeoutId) clearTimeout(fastModeTimeoutId);
            intervalId = null;
            timeoutId = null;
            fastModeTimeoutId = null;
            isFastMode = false;
        };

        button.addEventListener('mousedown', () => {
            handleButtonAction(1);
            timeoutId = setTimeout(startRapidChanges, CONSTANTS.BUTTON_HOLD_DELAY);
        });
        button.addEventListener('mouseup', stopRapidChanges);
        button.addEventListener('mouseleave', stopRapidChanges);

        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleButtonAction(1);
            timeoutId = setTimeout(startRapidChanges, CONSTANTS.BUTTON_HOLD_DELAY);
        });
        button.addEventListener('touchend', stopRapidChanges);
        button.addEventListener('touchcancel', stopRapidChanges);
    });
}

function handleCalculate(e) {
    triggerBtnAnimation(elements.calculateBtn);
    const roll = elements.rollInput.value === '' ? null : parseInt(elements.rollInput.value);
    const soy = elements.soyInput.value === '' ? null : parseInt(elements.soyInput.value);
    if (!roll || !soy || roll < CONSTANTS.MIN_VALUE || soy < CONSTANTS.MIN_VALUE) {
        showPopup("Invalid input");
        return;
    }
    const water = Math.round(soy * CONSTANTS.WATER_MULTIPLIER);
    const flour = Math.round(soy * CONSTANTS.FLOUR_MULTIPLIER);
    const mold = ((soy + flour) * CONSTANTS.MOLD_MULTIPLIER_1 / CONSTANTS.MOLD_MULTIPLIER_2).toFixed(2);
    const weight = Math.floor((soy + water + parseFloat(mold) + flour) / roll);
    elements.waterResult.textContent = water;
    elements.moldResult.textContent = mold;
    elements.flourResult.textContent = flour;
    elements.weightResult.textContent = weight;
}

// Helper to trigger animation of Calculate button exactly once per tap
function triggerBtnAnimation(btn) {
    btn.classList.remove('single-pulse');
    void btn.offsetWidth;
    btn.classList.add('single-pulse');
}

document.addEventListener('DOMContentLoaded', initApp);