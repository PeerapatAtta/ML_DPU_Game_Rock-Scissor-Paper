const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const textResult = document.getElementById('textResult');
const aiGestureElement = document.getElementById('aiGesture');
const countdownElement = document.getElementById('countdown');
const player1Text = document.getElementById('player1Text');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');
const gameTurnElement = document.getElementById('gameTurn');
const aiGestureImage = document.getElementById('aiGestureImage'); // ช่องแสดงภาพท่าทางของ AI

let player1Score = 0;
let player2Score = 0;
let player1Gesture = ''; // ท่าทางของ Player 1
let gameInProgress = false; // ใช้เพื่อตรวจสอบสถานะของเกม
let countdown = 3;
let handHoldTime = 0; // เวลาในการยกมือค้างไว้
let handDetected = false;
let gameTurn = 1; // ตัวแปรสำหรับนับจำนวนเทิร์นของเกม

const drawingUtils = window;
const holistic = new Holistic({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`;
    }
});

holistic.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

holistic.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        if (gameInProgress) {
            await holistic.send({ image: videoElement });
        }
    },
    width: 640,
    height: 480
});
camera.start();

startButton.addEventListener('click', () => {
    if (!gameInProgress) {
        resetTurn();
        player1Text.textContent = 'Show your hand in front of the camera.';
    }
});

resetButton.addEventListener('click', resetGame); // ปุ่มสำหรับรีเซ็ตเกมใหม่

function onResults(results) {
    if (!gameInProgress) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    const hands = [
        { landmarks: results.leftHandLandmarks, label: 'Left' },
        { landmarks: results.rightHandLandmarks, label: 'Right' }
    ];

    let detected = false;

    for (const hand of hands) {
        if (hand.landmarks) {
            detected = true;
            drawingUtils.drawConnectors(canvasCtx, hand.landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            drawingUtils.drawLandmarks(canvasCtx, hand.landmarks, { color: '#00FF00', lineWidth: 2 });
            player1Gesture = detectGesture(hand.landmarks);
            player1Text.textContent = `Player 1 Gesture: ${player1Gesture}`;
        }
    }

    // ถ้าเจอมือ
    if (detected) {
        if (!handDetected) {
            handDetected = true;
            handHoldTime = 0; // รีเซ็ตเวลานับการยกมือ
        }
        handHoldTime += 1; // เพิ่มเวลาในการยกมือ
    } else {
        handDetected = false; // ไม่พบมือ รีเซ็ต
        handHoldTime = 0;
        player1Text.textContent = 'Show your hand in front of the camera.';
    }

    // ถ้า Player 1 ยกมือค้างไว้ครบ 2 วินาที
    if (handHoldTime >= 60) { // 60 เฟรม = ประมาณ 2 วินาที (ในกรณีที่ 30fps)
        startCountdown();
        gameInProgress = false; // หยุดการตรวจจับเพิ่มเติมหลังจากเริ่มเกม
    }

    canvasCtx.restore();
}

function startCountdown() {
    countdownElement.textContent = `Countdown: ${countdown}`;

    const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = `Countdown: ${countdown}`;

        if (countdown === 0) {
            clearInterval(countdownInterval);
            countdownElement.textContent = '';
            generateAIGesture();
        }
    }, 1000);
}

function generateAIGesture() {
    const aiGesture = getRandomGesture();
    aiGestureElement.textContent = `AI: ${aiGesture}`;

    // แสดงภาพท่าทางของ AI
    aiGestureImage.src = getGestureImage(aiGesture);

    const result = compareGestures(player1Gesture, aiGesture);
    updateResult(result);  // ใช้ฟังก์ชันนี้ในการอัปเดตผลลัพธ์

    if (result === 'Win') {
        player1Score++;
    } else if (result === 'Lose') {
        player2Score++;
    }

    // อัปเดตคะแนน
    player1ScoreElement.textContent = `Player 1 Score: ${player1Score}`;
    player2ScoreElement.textContent = `Player 2 Score: ${player2Score}`;

    // อัปเดตเทิร์นของเกม
    gameTurn++;
    gameTurnElement.textContent = `Turn: ${gameTurn}`;

    // เริ่มเทิร์นถัดไปโดยอัตโนมัติ
    setTimeout(resetTurn, 1000);  // เริ่มเทิร์นใหม่หลังจากแสดงผลลัพธ์ 3 วินาที
}

function updateResult(result) {
    textResult.textContent = `Result: ${result}`;
    if (result === 'Win') {
        textResult.className = 'win';
    } else if (result === 'Lose') {
        textResult.className = 'lose';
    } else {
        textResult.className = '';
    }
}

function resetTurn() {
    player1Gesture = '';
    gameInProgress = true;
    countdown = 3;
    handHoldTime = 0;
    handDetected = false;
    textResult.textContent = '';
    aiGestureElement.textContent = 'AI: Waiting...';
    aiGestureImage.src = '/Tiger7.png';  // ล้างรูปภาพของ AI เมื่อเริ่มเทิร์นใหม่
    countdownElement.textContent = '';
}

function resetGame() {
    player1Score = 0;
    player2Score = 0;
    gameTurn = 1;
    resetTurn();
    player1ScoreElement.textContent = `Player 1 Score: ${player1Score}`;
    player2ScoreElement.textContent = `Player 2 Score: ${player2Score}`;
    gameTurnElement.textContent = `Turn: ${gameTurn}`;
}

function getRandomGesture() {
    const gestures = ['Rock', 'Paper', 'Scissors'];
    return gestures[Math.floor(Math.random() * gestures.length)];
}

function getGestureImage(gesture) {
    const gestureImages = {
        'Rock': '/rock.png',   // ใส่ URL ของภาพ Rock
        'Paper': '/paper.png', // ใส่ URL ของภาพ Paper
        'Scissors': '/scissors.png' // ใส่ URL ของภาพ Scissors
    };
    return gestureImages[gesture] || '/Tiger7.png';
}

function compareGestures(player1Gesture, aiGesture) {
    if (player1Gesture === aiGesture) return 'Draw';
    if (
        (player1Gesture === 'Rock' && aiGesture === 'Scissors') ||
        (player1Gesture === 'Scissors' && aiGesture === 'Paper') ||
        (player1Gesture === 'Paper' && aiGesture === 'Rock')
    ) {
        return 'Win';
    }
    return 'Lose';
}

// function detectGesture(landmarks) {
//     const allFingersExtended = landmarks.slice(8, 21).every(landmark => landmark.y < landmarks[5].y);
//     if (allFingersExtended) return 'Paper';

//     const onlyIndexAndMiddleExtended =
//         landmarks[8].y < landmarks[6].y &&  // Index finger extended
//         landmarks[12].y < landmarks[10].y && // Middle finger extended
//         landmarks[16].y > landmarks[14].y && // Ring finger not extended
//         landmarks[20].y > landmarks[18].y;   // Pinky finger not extended
//     if (onlyIndexAndMiddleExtended) return 'Scissors';

//     return 'Rock';
// }

function detectGesture(landmarks) {
    // ตรวจสอบนิ้วแต่ละนิ้วว่าถูกเหยียดออกหรือไม่
    const thumbExtended = landmarks[4].x < landmarks[3].x; // นิ้วโป้งยืดออก
    const indexExtended = landmarks[8].y < landmarks[6].y; // นิ้วชี้ยืดออก
    const middleExtended = landmarks[12].y < landmarks[10].y; // นิ้วกลางยืดออก
    const ringExtended = landmarks[16].y < landmarks[14].y; // นิ้วนางยืดออก
    const pinkyExtended = landmarks[20].y < landmarks[18].y; // นิ้วก้อยยืดออก

    // ถ้านิ้วทั้งหมดเหยียดตรง ให้ตรวจจับเป็น "Paper"
    if (thumbExtended && indexExtended && middleExtended && ringExtended && pinkyExtended) {
        return 'Paper';
    }

    // ถ้าเหยียดนิ้วชี้และนิ้วกลาง แต่ไม่เหยียดนิ้วนางและนิ้วก้อย ให้ตรวจจับเป็น "Scissors"
    const onlyIndexAndMiddleExtended =
        indexExtended && middleExtended && !ringExtended && !pinkyExtended;
    if (onlyIndexAndMiddleExtended) {
        return 'Scissors';
    }

    // ถ้าไม่มีนิ้วไหนเหยียดตรง (นิ้วหุบทั้งหมด) ให้ตรวจจับเป็น "Rock"
    const noFingersExtended = !indexExtended && !middleExtended && !ringExtended && !pinkyExtended;
    if (noFingersExtended) {
        return 'Rock';
    }

    // ถ้าไม่ตรงกับท่าทางใด ๆ ให้คืนค่าเป็น "Rock" เป็นค่าดีฟอลต์
    return 'Paper';
}
