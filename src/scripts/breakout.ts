import { bindPointerDrag } from './lib/touch';

type GameState = 'ready' | 'playing' | 'paused' | 'gameover';

const PLAY_WIDTH = 480;
const PLAY_HEIGHT = 600;

const BRICK_COLS = 8;
const BRICK_ROWS = 6;
const BRICK_TOP = 70;
const SIDE_PADDING = 20;
const BRICK_GAP = 6;
const BRICK_HEIGHT = 20;

const PADDLE_WIDTH = 84;
const PADDLE_HEIGHT = 12;
const PADDLE_SPEED = 460;

const BALL_RADIUS = 7;
const BALL_START_SPEED = 300;
const BALL_MAX_SPEED = 520;
const BALL_SPEEDUP = 8;
const MAX_BOUNCE_ANGLE = (60 * Math.PI) / 180;

const START_LIVES = 3;
const HIGH_SCORE_KEY = 'backloggames-breakout-high-score';

const COLORS = {
  background: '#0f1419',
  wall: '#19212b',
  paddle: '#7ee787',
  ball: '#f4f1ea',
  text: '#f4f1ea',
  textMuted: '#9aa6b3',
};

const ROW_COLORS = ['#e85d5d', '#e8975d', '#e8d15d', '#7ee787', '#5db8e8', '#a98de8'];
const ROW_POINTS = [60, 50, 40, 30, 20, 10];

type Brick = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  points: number;
  alive: boolean;
};

export function initBreakout(root: HTMLElement): () => void {
  root.innerHTML = '';
  root.className = 'flex min-h-[420px] flex-col items-center justify-center gap-4 p-4';

  const hud = document.createElement('div');
  hud.className =
    'flex w-full max-w-[480px] items-center justify-between gap-2 text-sm text-games-ink-muted';

  const scoreEl = document.createElement('span');
  scoreEl.textContent = 'Score: 0';

  const highScoreEl = document.createElement('span');
  const savedHigh = Number(localStorage.getItem(HIGH_SCORE_KEY) ?? 0);
  highScoreEl.textContent = `Best: ${savedHigh}`;

  const livesEl = document.createElement('span');
  livesEl.textContent = `Lives: ${START_LIVES}`;

  const statusEl = document.createElement('span');
  statusEl.className = 'text-games-accent';
  statusEl.textContent = 'Tap or Space to launch';

  hud.append(scoreEl, highScoreEl, livesEl, statusEl);

  const canvas = document.createElement('canvas');
  canvas.className = 'max-w-full touch-none rounded-lg border border-games-border';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Breakout game board');

  const help = document.createElement('p');
  help.className = 'text-center text-xs text-games-ink-muted';
  help.textContent =
    'Drag or A/D to move the paddle. Tap or Space to launch. P to pause.';

  root.append(hud, canvas, help);

  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;

  let scale = 1;
  let bricks: Brick[] = [];
  let paddleX = (PLAY_WIDTH - PADDLE_WIDTH) / 2;
  const paddleY = PLAY_HEIGHT - 40;
  let ballX = PLAY_WIDTH / 2;
  let ballY = paddleY - BALL_RADIUS;
  let ballVX = 0;
  let ballVY = 0;
  let launched = false;
  let score = 0;
  let highScore = savedHigh;
  let lives = START_LIVES;
  let state: GameState = 'ready';
  let won = false;
  const keys = { left: false, right: false };
  let rafId: number | null = null;
  let lastTime = 0;

  function resizeCanvas() {
    const width = Math.min(root.clientWidth - 32, PLAY_WIDTH);
    scale = width / PLAY_WIDTH;
    canvas.width = Math.round(PLAY_WIDTH * scale);
    canvas.height = Math.round(PLAY_HEIGHT * scale);
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    draw();
  }

  function buildBricks() {
    bricks = [];
    const usableWidth = PLAY_WIDTH - SIDE_PADDING * 2;
    const brickWidth = (usableWidth - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          x: SIDE_PADDING + col * (brickWidth + BRICK_GAP),
          y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
          width: brickWidth,
          height: BRICK_HEIGHT,
          color: ROW_COLORS[row],
          points: ROW_POINTS[row],
          alive: true,
        });
      }
    }
  }

  function resetBall() {
    launched = false;
    paddleX = (PLAY_WIDTH - PADDLE_WIDTH) / 2;
    ballX = paddleX + PADDLE_WIDTH / 2;
    ballY = paddleY - BALL_RADIUS;
    ballVX = 0;
    ballVY = 0;
  }

  function resetGame() {
    score = 0;
    lives = START_LIVES;
    won = false;
    scoreEl.textContent = 'Score: 0';
    livesEl.textContent = `Lives: ${START_LIVES}`;
    buildBricks();
    resetBall();
  }

  function launchBall() {
    if (launched) return;
    launched = true;
    const angle = (Math.random() * 0.5 - 0.25) * Math.PI - Math.PI / 2;
    ballVX = Math.cos(angle) * BALL_START_SPEED;
    ballVY = Math.sin(angle) * BALL_START_SPEED;
  }

  function setState(next: GameState) {
    state = next;
    if (state === 'ready') {
      statusEl.textContent = 'Tap or Space to launch';
    } else if (state === 'playing') {
      statusEl.textContent = launched ? 'Playing' : 'Tap or Space to launch';
    } else if (state === 'paused') {
      statusEl.textContent = 'Paused';
    } else {
      statusEl.textContent = won ? 'You win! — tap or Space to replay' : 'Game over — tap or Space to retry';
    }
    draw();
  }

  function updateScore(points: number) {
    score += points;
    scoreEl.textContent = `Score: ${score}`;
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = `Best: ${highScore}`;
      localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
    }
  }

  function loseLife() {
    lives -= 1;
    livesEl.textContent = `Lives: ${Math.max(lives, 0)}`;
    if (lives <= 0) {
      won = false;
      setState('gameover');
      return;
    }
    resetBall();
    statusEl.textContent = 'Life lost — tap or Space to launch';
  }

  function currentSpeed() {
    return Math.hypot(ballVX, ballVY);
  }

  function bounceOffPaddle() {
    const paddleCenter = paddleX + PADDLE_WIDTH / 2;
    const offset = (ballX - paddleCenter) / (PADDLE_WIDTH / 2);
    const clamped = Math.max(-1, Math.min(1, offset));
    const angle = clamped * MAX_BOUNCE_ANGLE;
    const speed = Math.min(currentSpeed() + BALL_SPEEDUP, BALL_MAX_SPEED);
    ballVX = speed * Math.sin(angle);
    ballVY = -speed * Math.cos(angle);
    ballY = paddleY - BALL_RADIUS;
  }

  function handleBrickCollisions() {
    for (const brick of bricks) {
      if (!brick.alive) continue;
      const nearestX = Math.max(brick.x, Math.min(ballX, brick.x + brick.width));
      const nearestY = Math.max(brick.y, Math.min(ballY, brick.y + brick.height));
      const dx = ballX - nearestX;
      const dy = ballY - nearestY;
      if (dx * dx + dy * dy > BALL_RADIUS * BALL_RADIUS) continue;

      brick.alive = false;
      updateScore(brick.points);

      const overlapLeft = ballX + BALL_RADIUS - brick.x;
      const overlapRight = brick.x + brick.width - (ballX - BALL_RADIUS);
      const overlapTop = ballY + BALL_RADIUS - brick.y;
      const overlapBottom = brick.y + brick.height - (ballY - BALL_RADIUS);
      const minX = Math.min(overlapLeft, overlapRight);
      const minY = Math.min(overlapTop, overlapBottom);

      if (minX < minY) {
        ballVX = -ballVX;
      } else {
        ballVY = -ballVY;
      }

      if (!bricks.some((b) => b.alive)) {
        won = true;
        setState('gameover');
      }
      return;
    }
  }

  function update(dt: number) {
    const move = PADDLE_SPEED * dt;
    if (keys.left) paddleX -= move;
    if (keys.right) paddleX += move;
    paddleX = Math.max(0, Math.min(PLAY_WIDTH - PADDLE_WIDTH, paddleX));

    if (!launched) {
      ballX = paddleX + PADDLE_WIDTH / 2;
      ballY = paddleY - BALL_RADIUS;
      return;
    }

    ballX += ballVX * dt;
    ballY += ballVY * dt;

    if (ballX - BALL_RADIUS < 0) {
      ballX = BALL_RADIUS;
      ballVX = Math.abs(ballVX);
    } else if (ballX + BALL_RADIUS > PLAY_WIDTH) {
      ballX = PLAY_WIDTH - BALL_RADIUS;
      ballVX = -Math.abs(ballVX);
    }

    if (ballY - BALL_RADIUS < 0) {
      ballY = BALL_RADIUS;
      ballVY = Math.abs(ballVY);
    }

    if (
      ballVY > 0 &&
      ballY + BALL_RADIUS >= paddleY &&
      ballY - BALL_RADIUS <= paddleY + PADDLE_HEIGHT &&
      ballX >= paddleX &&
      ballX <= paddleX + PADDLE_WIDTH
    ) {
      bounceOffPaddle();
    }

    handleBrickCollisions();

    if (ballY - BALL_RADIUS > PLAY_HEIGHT) {
      loseLife();
    }
  }

  function drawRoundedRect(x: number, y: number, w: number, h: number, r: number) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);

    for (const brick of bricks) {
      if (!brick.alive) continue;
      ctx.fillStyle = brick.color;
      drawRoundedRect(brick.x, brick.y, brick.width, brick.height, 4);
    }

    ctx.fillStyle = COLORS.paddle;
    drawRoundedRect(paddleX, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT, 6);

    ctx.fillStyle = COLORS.ball;
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    if (state !== 'playing') {
      ctx.fillStyle = 'rgba(15, 20, 25, 0.72)';
      ctx.fillRect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const message =
        state === 'ready'
          ? 'Tap or Space to play'
          : state === 'paused'
            ? 'Paused'
            : won
              ? 'You Win!'
              : 'Game Over';

      ctx.fillText(message, PLAY_WIDTH / 2, PLAY_HEIGHT / 2 - 14);
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText(
        state === 'gameover' ? `Score: ${score}` : 'Drag to move paddle',
        PLAY_WIDTH / 2,
        PLAY_HEIGHT / 2 + 14,
      );
    }
  }

  function frame(time: number) {
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 1 / 30) : 0;
    lastTime = time;
    if (state === 'playing') update(dt);
    draw();
    rafId = requestAnimationFrame(frame);
  }

  function onSpace() {
    if (state === 'paused') {
      setState('playing');
      return;
    }
    if (state === 'gameover') {
      resetGame();
      setState('playing');
    }
    if (!launched) {
      launchBall();
      if (state === 'ready') setState('playing');
      else statusEl.textContent = 'Playing';
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();

    if (key === ' ' || key === 'enter') {
      event.preventDefault();
      onSpace();
      return;
    }

    if (key === 'p' && (state === 'playing' || state === 'paused')) {
      event.preventDefault();
      setState(state === 'playing' ? 'paused' : 'playing');
      return;
    }

    if (key === 'arrowleft' || key === 'a') keys.left = true;
    else if (key === 'arrowright' || key === 'd') keys.right = true;
  }

  function onKeyUp(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') keys.left = false;
    else if (key === 'arrowright' || key === 'd') keys.right = false;
  }

  function pointerToPlayX(clientX: number) {
    const rect = canvas.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * PLAY_WIDTH;
  }

  function movePaddleToClientX(clientX: number) {
    const x = pointerToPlayX(clientX);
    paddleX = Math.max(0, Math.min(PLAY_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2));
  }

  const unbindPointer = bindPointerDrag(
    canvas,
    (clientX) => {
      if (state !== 'playing') return;
      movePaddleToClientX(clientX);
    },
    { onDown: onSpace },
  );

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(root);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  resetGame();
  setState('ready');
  resizeCanvas();
  rafId = requestAnimationFrame(frame);

  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    resizeObserver.disconnect();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    unbindPointer();
    root.innerHTML = '';
  };
}
