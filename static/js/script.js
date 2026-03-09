document.addEventListener('DOMContentLoaded', () => {
    const leaveInput = document.getElementById('leaveDays');
    const calcDateInput = document.getElementById('calcDate');
    const attendanceValue = document.getElementById('attendanceValue');
    const statusText = document.getElementById('statusText');
    const statusCard = document.getElementById('statusCard');
    const totalDaysSpan = document.getElementById('totalWorkingDays');
    const presentDaysSpan = document.getElementById('presentDays');
    const allowedLeavesSpan = document.getElementById('allowedLeaves');
    const eligibilityNotice = document.getElementById('eligibilityNotice');
    const installBtn = document.getElementById('installBtn');
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Theme Persistence
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        themeToggle.querySelector('.icon').innerText = '🌙';
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-theme');
        const isLight = body.classList.contains('light-theme');
        themeToggle.querySelector('.icon').innerText = isLight ? '🌙' : '☀️';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });

    // Configuration
    const startDate = new Date(2026, 0, 1);
    const endDate = new Date(2026, 3, 30);

    const holidays = [
        "2026-01-01", "2026-01-14", "2026-01-15", "2026-01-23", "2026-01-26",
        "2026-02-19", "2026-03-04", "2026-03-19", "2026-03-21", "2026-03-26",
        "2026-03-31", "2026-04-03", "2026-04-14"
    ];

    function isSecondOrFourthSaturday(date) {
        if (date.getDay() !== 6) return false;
        const day = date.getDate();
        return (day >= 8 && day <= 14) || (day >= 22 && day <= 28);
    }

    function calculateWorkingDays(upToDateStr) {
        let count = 0;
        let cur = new Date(startDate);
        const limit = new Date(upToDateStr);
        limit.setHours(23, 59, 59, 999);

        while (cur <= limit && cur <= endDate) {
            const dayOfWeek = cur.getDay();
            const year = cur.getFullYear();
            const month = String(cur.getMonth() + 1).padStart(2, '0');
            const day = String(cur.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            if (dayOfWeek !== 0 && !isSecondOrFourthSaturday(cur) && !holidays.includes(dateString)) {
                count++;
            }
            cur.setDate(cur.getDate() + 1);
        }
        return count;
    }

    function updateCalculations() {
        const leaveDays = parseFloat(leaveInput.value) || 0;
        const selectedDateStr = calcDateInput.value;

        const workingDaysElapsed = calculateWorkingDays(selectedDateStr);
        const workingDaysTotal = calculateWorkingDays('2026-04-30');

        const presentDays = Math.max(0, workingDaysElapsed - leaveDays);
        const percentage = workingDaysElapsed > 0 ? (presentDays / workingDaysElapsed) * 100 : 0;

        attendanceValue.innerText = percentage.toFixed(2) + '%';
        presentDaysSpan.innerText = presentDays;
        totalDaysSpan.innerText = workingDaysElapsed;

        const maxLeavesTotal = Math.floor(workingDaysTotal * 0.2);
        allowedLeavesSpan.innerText = maxLeavesTotal;
        const leavesLeft = Math.max(0, maxLeavesTotal - leaveDays);

        if (percentage >= 80) {
            statusText.innerText = 'ELIGIBLE';
            statusCard.className = 'card status-card status-eligible';
            eligibilityNotice.innerText = `You can take ${leavesLeft} more leaves in total.`;
        } else {
            statusText.innerText = 'BELOW REQUIREMENT';
            statusCard.className = 'card status-card status-not-eligible';
            eligibilityNotice.innerText = `You need to maintain attendance from now on.`;
        }
    }

    // View Switching Logic
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.screen');

    navItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            screens.forEach(s => s.classList.remove('active'));

            item.classList.add('active');
            screens[index].classList.add('active');
        });
    });

    leaveInput.addEventListener('input', updateCalculations);
    calcDateInput.addEventListener('change', updateCalculations);
    updateCalculations();

    // PWA Logic
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'block';
    });

    installBtn.addEventListener('click', () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => {
                deferredPrompt = null;
                installBtn.style.display = 'none';
            });
        }
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/static/js/sw.js');
    }
});
