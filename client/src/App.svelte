<script>
    import confetti from "canvas-confetti";
    import bg from "./assets/maptexture2.webp";
    import buttonBg from "./assets/texture_crack_base.png";
    import texture from "./assets/texture_paper.png";
    import timerSound from "./assets/timer-end.mp3"; // Add your audio file here

    let lessons = "0 / 0";
    let courses = "0 / 0";
    let hours = "0";
    let errors = "0";
    let daysRemaining = "Too many...";
    let countdownTime = "00:00";
    let countdownSeconds = 0;
    let countdownInterval = null;
    let countupSeconds = 0;
    let countupInterval = null;
    let isCountingUp = false;
    let isPaused = false;
    let timerEndSound = null;
    let lastLessonsCompleted = 0;
    let lastCoursesCompleted = 0;
    let lessonsProgress = 0;
    let courseTitle = "";

    const PARTICLE_COUNT = 50;
    const SPREAD = 75;

    const socket = new WebSocket("ws://localhost:3001");

    // Initialize timer end sound
    function initializeSound() {
        timerEndSound = new Audio(timerSound);
        timerEndSound.volume = 0.7; // Adjust volume as needed (0.0 to 1.0)
    }

    function playTimerEndSound() {
        if (timerEndSound) {
            timerEndSound.currentTime = 0; // Reset to beginning
            timerEndSound.play().catch((error) => {
                console.log("Could not play timer end sound:", error);
            });
        }
    }

    function confettiLeft() {
        confetti({
            particleCount: PARTICLE_COUNT,
            angle: 60,
            spread: SPREAD,
            origin: { x: 0, y: 1 },
        });
    }

    function confettiRight() {
        confetti({
            particleCount: PARTICLE_COUNT,
            angle: 120,
            spread: SPREAD,
            origin: { x: 1, y: 1 },
        });
    }

    function startCountdown(minutes) {
        // Clear any existing timers
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        if (countupInterval) {
            clearInterval(countupInterval);
            countupInterval = null;
        }

        isCountingUp = false;
        countdownSeconds = minutes * 60;
        updateCountdownDisplay();

        countdownInterval = setInterval(() => {
            countdownSeconds--;
            updateCountdownDisplay();

            if (countdownSeconds <= 0) {
                clearInterval(countdownInterval);
                countdownInterval = null;
                // Trigger confetti and sound when timer reaches zero
                confettiLeft();
                confettiRight();
                playTimerEndSound();
            }
        }, 1000);
    }

    function updateCountdownDisplay() {
        const displaySeconds = isCountingUp ? countupSeconds : countdownSeconds;
        const hours = Math.floor(displaySeconds / 3600);
        const minutes = Math.floor((displaySeconds % 3600) / 60);
        const seconds = displaySeconds % 60;
        
        if (hours > 0) {
            countdownTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        } else {
            countdownTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }
    }

    function startCountup() {
        // Clear any existing timers
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        if (countupInterval) {
            clearInterval(countupInterval);
        }

        isCountingUp = true;
        countupSeconds = 0;
        updateCountdownDisplay();

        countupInterval = setInterval(() => {
            countupSeconds++;
            updateCountdownDisplay();
        }, 1000);
    }

    function pauseTimer() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        if (countupInterval) {
            clearInterval(countupInterval);
            countupInterval = null;
        }
        isPaused = true;
    }

    function resumeTimer() {
        if (!isPaused) return;

        isPaused = false;
        
        if (isCountingUp) {
            countupInterval = setInterval(() => {
                countupSeconds++;
                updateCountdownDisplay();
            }, 1000);
        } else if (countdownSeconds > 0) {
            countdownInterval = setInterval(() => {
                countdownSeconds--;
                updateCountdownDisplay();

                if (countdownSeconds <= 0) {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                    // Trigger confetti and sound when timer reaches zero
                    confettiLeft();
                    confettiRight();
                    playTimerEndSound();
                }
            }, 1000);
        }
    }

    function stopTimer() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        if (countupInterval) {
            clearInterval(countupInterval);
            countupInterval = null;
        }
        isCountingUp = false;
        isPaused = false;
        countdownTime = "00:00";
        countdownSeconds = 0;
        countupSeconds = 0;
    }

    // Initialize sound on first user interaction
    let soundInitialized = false;
    function ensureSoundInitialized() {
        if (!soundInitialized) {
        try{

            initializeSound();
            soundInitialized = true;
        } catch(e) {
          console.log('Sound file missing', e)
        }
        }
    }

    socket.onmessage = (event) => {
        ensureSoundInitialized();
        const data = JSON.parse(event.data);
        if (data.progress) {
            const p = data.progress;
            const lessonsCompleted = Number(p.lessons_completed) || 0;
            const lessonsTotal = Number(p.lessons_total) || 0;
            const coursesCompleted = Number(p.courses_completed) || 0;
            const coursesTotal = Number(p.courses_total) || 0;
            const hoursStudied = Number(p.hours_studied) || 0;
            const errorsMade = Number(p.errors_made) || 0;
            const title = p.course_title || "";
            const timerMinutes = Number(p.timer_minutes) || 0;
            const timerMode = p.timer_mode || "countdown";

            // Confetti from left and right if incremented
            if (lessonsCompleted > lastLessonsCompleted) {
                confettiLeft();
                confettiRight();
            }
            if (coursesCompleted > lastCoursesCompleted) {
                confettiLeft();
                confettiRight();
            }

            lessons = `${lessonsCompleted} / ${lessonsTotal}`;
            courses = `${coursesCompleted} / ${coursesTotal}`;
            hours = `${hoursStudied}`;
            errors = `${errorsMade}`;
            courseTitle = title;

            // Calculate days remaining based on lessons progress and hours studied
            // Assumption: Each lesson takes a certain amount of time, and we study 6 hours per day
            const remainingLessons = lessonsTotal - lessonsCompleted;
            let estimatedDays = 0;

            if (remainingLessons > 0 && lessonsCompleted > 0) {
                // Calculate hours per lesson based on current progress
                const hoursPerLesson = hoursStudied / lessonsCompleted;
                const hoursRemaining = remainingLessons * hoursPerLesson;
                estimatedDays = Math.ceil(hoursRemaining / 6); // 6 hours per day
            }

            daysRemaining = `${estimatedDays}`;

            lessonsProgress =
                lessonsTotal > 0 ? (lessonsCompleted / lessonsTotal) * 100 : 0;

            // Handle timer based on mode
            if (timerMode === "countup") {
                startCountup();
            } else if (timerMode === "stop") {
                stopTimer();
            } else if (timerMode === "pause") {
                pauseTimer();
            } else if (timerMode === "resume") {
                resumeTimer();
            } else if (timerMinutes > 0 && timerMinutes !== countdownSeconds / 60) {
                startCountdown(timerMinutes);
            }

            lastLessonsCompleted = lessonsCompleted;
            lastCoursesCompleted = coursesCompleted;
        }
    };
</script>

<main>
    <div class="bottom">
        <div class="title-container">
            <div class="timer-display">
                {countdownTime}
            </div>
            <div
                class="card title-card"
                style="background-image: url('{texture}'), url('{buttonBg}'), radial-gradient(
                        88.86% 132.66% at 50% 92.32%,
                        transparent 0,
                        transparent 30%,
                        #000 100%
                    );"
            >
                <span class="sub-text">Current course:</span>
                {courseTitle}
            </div>
        </div>
        <div class="container">
            <div
                class="card"
                style="background-image: url('{bg}'), linear-gradient(#121620, #181b26);"
            >
                Lessons Completed: {lessons}
            </div>
            <div
                class="card"
                style="background-image: url('{bg}'), linear-gradient(#121620, #181b26);"
            >
                Courses Completed: {courses}
            </div>
            <div
                class="card"
                style="background-image: url('{bg}'), linear-gradient(#121620, #181b26);"
            >
                Hours Studied: {hours}
            </div>
            <div
                class="card"
                style="background-image: url('{bg}'), linear-gradient(#121620, #181b26);"
            >
                Errors Made: {errors}
            </div>
            <div
                class="card"
                style="background-image: url('{bg}'), linear-gradient(#121620, #181b26);"
            >
                Estimated Days Left: {Number(daysRemaining) > 0
                    ? daysRemaining
                    : "Too many..."}
            </div>
        </div>
        <div
            class="card progress-card"
            style="background-image: url('{bg}'), linear-gradient(#121620, #181b26);"
        >
            <div>Total Progress:</div>
            <div class="progress-bar">
                <div class="progress" style="width: {lessonsProgress}%"></div>
            </div>
        </div>
    </div>
</main>

<style>
    main {
        background: transparent;
        aspect-ratio: 16/9;
        color: white;
        font-family: sans-serif;
        display: flex;
        padding: 1rem;
    }
    .bottom {
        align-self: flex-end;
        width: calc(100% - 395px);
    }
    .container {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }
    .title-container {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    .timer-display {
        background-image:
            url("../assets/texture_paper.png"),
            url("../assets/texture_crack_base.png"),
            radial-gradient(
                88.86% 132.66% at 50% 92.32%,
                #2a1c0c 0,
                #c18500 50%,
                #2a1c0c 100%
            );
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
        font-size: 1.5rem;
        font-weight: bold;
        white-space: nowrap;
        text-shadow: 0 0 10px rgba(193, 133, 0, 0.5);
    }
    .title-card {
        flex: 0 !important;
        white-space: nowrap;
        max-width: 80%;
        min-width: unset !important;
        width: fit-content;
        margin: 0 auto;
        text-align: center;
        font-weight: semibold;
        position: relative;
        color: #d7dee6;
        font-size: 2rem;
        border: 3px solid #c18500 !important;
        background-color: #2a1c0c !important;
    }
    .sub-text {
        position: absolute;
        top: 4px;
        left: 10px;
        font-size: 0.75rem;
    }
    .card {
        background-blend-mode: overlay;
        background-size: cover;
        background-position: 50%;
        background-repeat: no-repeat;
        color: #cad6e3;
        padding: 1rem;
        border: 1px solid #635c52;
        flex: 1;
        min-width: 120px;
    }
    .progress-card {
        margin-top: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .progress-bar {
        flex: 1;
        height: 10px;
        margin: 0 auto;
        background-color: #444;
        border-radius: 5px;
        overflow: hidden;
    }
    .progress {
        width: 0;
        height: 100%;
        background-color: #c18500;
        transition: width 0.3s ease;
    }
</style>
