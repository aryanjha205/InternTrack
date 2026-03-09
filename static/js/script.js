document.addEventListener('DOMContentLoaded', () => {
    const leaveInput = document.getElementById('leaveDays');
    const attendanceValue = document.getElementById('attendanceValue');
    const statusText = document.getElementById('statusText');
    const statusCard = document.getElementById('statusCard');
    const totalDaysSpan = document.getElementById('totalWorkingDays');
    const presentDaysSpan = document.getElementById('presentDays');
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
    const startDate = new Date(2026, 0, 1); // Jan 1, 2026
    const endDate = new Date(2026, 3, 30);   // Apr 30, 2026

    const holidays = [
        "2026-01-01", // New Year's Day
        "2026-01-14", // Makar Sankranti
        "2026-01-15", // Vasi Uttarayan
        "2026-01-23", // Basant Panchami
        "2026-01-26", // Republic Day
        "2026-02-19", // Shivaji Jayanti
        "2026-03-04", // Dhuleti/Holi
        "2026-03-19", // Cheti Chand
        "2026-03-21", // Id-ul-Fitr
        "2026-03-26", // Ram Navami
        "2026-03-31", // Mahavir Jayanti
        "2026-04-03", // Good Friday
        "2026-04-14", // Ambedkar Jayanti
    ];

    function isSecondOrFourthSaturday(date) {
        if (date.getDay() !== 6) return false;
        const day = date.getDate();
        // 2nd Saturday: 8th to 14th
        // 4th Saturday: 22nd to 28th
        return (day >= 8 && day <= 14) || (day >= 22 && day <= 28);
    }

    const calcDateInput = document.getElementById('calcDate');

    function calculateWorkingDays(upToDate) {
        let count = 0;
        let cur = new Date(startDate);
        const limit = new Date(upToDate);
        limit.setHours(23, 59, 59, 999);

        while (cur <= limit && cur <= endDate) {
            const dayOfWeek = cur.getDay();
            // Use local date parts to avoid UTC shift issues
            const year = cur.getFullYear();
            const month = String(cur.getMonth() + 1).padStart(2, '0');
            const day = String(cur.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            const isSunday = (dayOfWeek === 0);
            const isOffSaturday = isSecondOrFourthSaturday(cur);
            const isHoliday = holidays.includes(dateString);

            if (!isSunday && !isOffSaturday && !isHoliday) {
                count++;
            }
            cur.setDate(cur.getDate() + 1);
        }
        return count;
    }

    function updateCalculations() {
        const leaveDays = parseFloat(leaveInput.value) || 0;
        const selectedDateStr = calcDateInput.value;
        const selectedDate = new Date(selectedDateStr);

        const workingDaysElapsed = calculateWorkingDays(selectedDateStr);
        const workingDaysTotal = calculateWorkingDays('2026-04-30');
        const workingDaysRemaining = workingDaysTotal - workingDaysElapsed;

        const presentDays = Math.max(0, workingDaysElapsed - leaveDays);
        const percentage = workingDaysElapsed > 0 ? (presentDays / workingDaysElapsed) * 100 : 0;

        attendanceValue.innerText = percentage.toFixed(2) + '%';
        presentDaysSpan.innerText = presentDays;
        totalDaysSpan.innerText = workingDaysElapsed;
        document.getElementById('allowedLeaves').innerText = maxLeavesTotal;

        // Calculate maximum allowed leaves for the WHOLE period to stay >= 80%
        // Formula: (TotalWorkingDays - MaxLeaves) / TotalWorkingDays >= 0.8
        // MaxLeaves = TotalWorkingDays * 0.2
        const maxLeavesTotal = Math.floor(workingDaysTotal * 0.2);
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

    leaveInput.addEventListener('input', updateCalculations);
    calcDateInput.addEventListener('change', updateCalculations);

    // Initial calculation
    updateCalculations();

    // PWA Install Logic
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'block';
    });

    installBtn.addEventListener('click', () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted install');
                }
                deferredPrompt = null;
                installBtn.style.display = 'none';
            });
        }
    });

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/static/js/sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch(err => console.error('Service Worker Registration Failed', err));
    }
});
