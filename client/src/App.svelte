<script>
    import confetti from "canvas-confetti";
    import bg from "./assets/maptexture2.webp";

    let lessons = "0 / 0";
    let courses = "0 / 0";
    let lastLessonsCompleted = 0;
    let lastCoursesCompleted = 0;
    let lessonsProgress = 0;

    const PARTICLE_COUNT = 50;
    const SPREAD = 75;

    const socket = new WebSocket("ws://localhost:3001");

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

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.progress) {
            const p = data.progress;
            const lessonsCompleted = Number(p.lessons_completed) || 0;
            const lessonsTotal = Number(p.lessons_total) || 0;
            const coursesCompleted = Number(p.courses_completed) || 0;
            const coursesTotal = Number(p.courses_total) || 0;

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
            lessonsProgress =
                lessonsTotal > 0 ? (lessonsCompleted / lessonsTotal) * 100 : 0;
            lastLessonsCompleted = lessonsCompleted;
            lastCoursesCompleted = coursesCompleted;
        }
    };
</script>

<main>
    <div class="bottom">
        <div class="container">
            <div
                class="card"
                style="background-image: url('{bg}'), linear-gradient(#121620, #181b26);"
            >
                Lessons: {lessons}
            </div>
            <div
                class="card"
                style="background-image: url('{bg}'), linear-gradient(#121620, #181b26);"
            >
                Courses: {courses}
            </div>
        </div>
        <div class="progress-bar">
            <div class="progress" style="width: {lessonsProgress}%"></div>
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
        /* background: #333; */
    }
    .bottom {
        align-self: flex-end;
        width: calc(100% - 395px);
    }
    .container {
        display: flex;
        gap: 1rem;
    }
    .card {
        background-blend-mode: overlay;
        background-size: cover;
        background-position: 50%;
        background-repeat: no-repeat;
        color: #cad6e3;
        padding: 1rem;
        border: 1px solid #cad6e3;
    }
    .progress-bar {
        width: 90%;
        height: 10px;
        margin: 0 auto;
        background-color: #444;
        border-radius: 5px;
        overflow: hidden;
        margin-top: 1rem;
    }
    .progress {
        width: 0;
        height: 100%;
        background-color: #e7b95f;
        transition: width 0.3s ease;
    }
</style>
