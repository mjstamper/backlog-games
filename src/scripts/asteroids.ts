import { bindTouchInput } from './lib/touch';
import { createVirtualControls } from './lib/virtualControls';

type GameState = 'ready' | 'playing' | 'paused' | 'gameover';
type Point = { x: number; y: number };

const PLAY_WIDTH = 640;
const PLAY_HEIGHT = 480;

const SHIP_SIZE = 16;
const SHIP_TURN_SPEED = 3.2;
const SHIP_THRUST = 280;
const SHIP_FRICTION = 0.992;
const SHIP_MAX_SPEED = 420;

const BULLET_SPEED = 520;
const BULLET_LIFE = 1.1;
const FIRE_COOLDOWN = 0.22;

const ASTEROID_SPEED = 90;
const START_LIVES = 3;
const START_ASTEROIDS = 4;
const HIGH_SCORE_KEY = 'backloggames-asteroids-high-score';

const COLORS = {
  background: '#0f1419',
  ship: '#7ee787',
  bullet: '#f4f1ea',
  asteroid: '#9aa6b3',
  text: '#f4f1ea',
  textMuted: '#9aa6b3',
};

type Ship = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  thrusting: boolean;
  invulnerable: number;
};

type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
};

type Asteroid = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  vertices: Point[];
};

const ASTEROID_POINTS = [20, 50, 100];
const ASTEROID_RADII = [36, 22, 12];

export function initAsteroids(root: HTMLElement): () => void {
  root.innerHTML = '';
  root.className = 'flex min-h-[420px] flex-col items-center justify-center gap-4 p-4';

  const hud = document.createElement('div');
  hud.className =
    'flex w-full max-w-[640px] flex-wrap items-center justify-between gap-2 text-sm text-games-ink-muted';

  const scoreEl = document.createElement('span');
  scoreEl.textContent = 'Score: 0';

  const highScoreEl = document.createElement('span');
  const savedHigh = Number(localStorage.getItem(HIGH_SCORE_KEY) ?? 0);
  highScoreEl.textContent = `Best: ${savedHigh}`;

  const livesEl = document.createElement('span');
  livesEl.textContent = `Lives: ${START_LIVES}`;

  const statusEl = document.createElement('span');
  statusEl.className = 'text-games-accent';
  statusEl.textContent = 'Tap or Space to start';

  hud.append(scoreEl, highScoreEl, livesEl, statusEl);

  const canvas = document.createElement('canvas');
  canvas.className = 'max-w-full touch-none rounded-lg border border-games-border';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Asteroids game board');

  const help = document.createElement('p');
  help.className = 'text-center text-xs text-games-ink-muted';
  help.textContent =
    'On-screen buttons or arrow keys to fly. Tap or Space to start and shoot. P to pause.';

  root.append(hud, canvas, help);

  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;

  let scale = 1;
  let ship: Ship;
  let bullets: Bullet[] = [];
  let asteroids: Asteroid[] = [];
  let score = 0;
  let highScore = savedHigh;
  let lives = START_LIVES;
  let state: GameState = 'ready';
  let fireTimer = 0;
  let rafId: number | null = null;
  let lastTime = 0;
  const keys = { left: false, right: false, up: false, shoot: false };

  function resizeCanvas() {
    const width = Math.min(root.clientWidth - 32, PLAY_WIDTH);
    scale = width / PLAY_WIDTH;
    canvas.width = Math.round(PLAY_WIDTH * scale);
    canvas.height = Math.round(PLAY_HEIGHT * scale);
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    draw();
  }

  function createShip(): Ship {
    return {
      x: PLAY_WIDTH / 2,
      y: PLAY_HEIGHT / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      thrusting: false,
      invulnerable: 2,
    };
  }

  function randomAsteroidVertices(radius: number): Point[] {
    const count = 8 + Math.floor(Math.random() * 3);
    const vertices: Point[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius * (0.75 + Math.random() * 0.35);
      vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    return vertices;
  }

  function spawnAsteroid(x: number, y: number, sizeIndex: number, speedScale = 1) {
    const radius = ASTEROID_RADII[sizeIndex];
    const angle = Math.random() * Math.PI * 2;
    const speed = (ASTEROID_SPEED + Math.random() * 40) * speedScale;
    asteroids.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      vertices: randomAsteroidVertices(radius),
    });
  }

  function spawnWave(count: number) {
    for (let i = 0; i < count; i++) {
      let x = 0;
      let y = 0;
      do {
        x = Math.random() * PLAY_WIDTH;
        y = Math.random() * PLAY_HEIGHT;
      } while (Math.hypot(x - ship.x, y - ship.y) < 120);
      spawnAsteroid(x, y, 0);
    }
  }

  function resetGame() {
    ship = createShip();
    bullets = [];
    asteroids = [];
    score = 0;
    lives = START_LIVES;
    fireTimer = 0;
    scoreEl.textContent = 'Score: 0';
    livesEl.textContent = `Lives: ${START_LIVES}`;
    spawnWave(START_ASTEROIDS);
  }

  function wrapPosition(entity: { x: number; y: number }) {
    if (entity.x < 0) entity.x += PLAY_WIDTH;
    if (entity.x > PLAY_WIDTH) entity.x -= PLAY_WIDTH;
    if (entity.y < 0) entity.y += PLAY_HEIGHT;
    if (entity.y > PLAY_HEIGHT) entity.y -= PLAY_HEIGHT;
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

  function fireBullet() {
    if (fireTimer > 0) return;
    fireTimer = FIRE_COOLDOWN;
    const noseX = ship.x + Math.cos(ship.angle) * SHIP_SIZE;
    const noseY = ship.y + Math.sin(ship.angle) * SHIP_SIZE;
    bullets.push({
      x: noseX,
      y: noseY,
      vx: ship.vx + Math.cos(ship.angle) * BULLET_SPEED,
      vy: ship.vy + Math.sin(ship.angle) * BULLET_SPEED,
      life: BULLET_LIFE,
    });
  }

  function destroyAsteroid(index: number) {
    const asteroid = asteroids[index];
    const sizeIndex = ASTEROID_RADII.indexOf(asteroid.radius);
    updateScore(ASTEROID_POINTS[sizeIndex] ?? 20);
    asteroids.splice(index, 1);

    if (sizeIndex < ASTEROID_RADII.length - 1) {
      spawnAsteroid(asteroid.x, asteroid.y, sizeIndex + 1, 1.15);
      spawnAsteroid(asteroid.x, asteroid.y, sizeIndex + 1, 1.15);
    }

    if (asteroids.length === 0) {
      spawnWave(START_ASTEROIDS + Math.floor(score / 500));
    }
  }

  function circleHit(
    ax: number,
    ay: number,
    ar: number,
    bx: number,
    by: number,
    br: number,
  ) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy <= (ar + br) * (ar + br);
  }

  function loseLife() {
    lives -= 1;
    livesEl.textContent = `Lives: ${Math.max(lives, 0)}`;
    if (lives <= 0) {
      setState('gameover');
      return;
    }
    ship = createShip();
    bullets = [];
    statusEl.textContent = 'Life lost — tap or Space to continue';
  }

  function setState(next: GameState) {
    state = next;
    if (state === 'ready') statusEl.textContent = 'Tap or Space to start';
    else if (state === 'playing') statusEl.textContent = 'Playing';
    else if (state === 'paused') statusEl.textContent = 'Paused';
    else statusEl.textContent = 'Game over — tap or Space to retry';
    draw();
  }

  function update(dt: number) {
    fireTimer = Math.max(0, fireTimer - dt);

    if (keys.left) ship.angle -= SHIP_TURN_SPEED * dt;
    if (keys.right) ship.angle += SHIP_TURN_SPEED * dt;

    ship.thrusting = keys.up;
    if (ship.thrusting) {
      ship.vx += Math.cos(ship.angle) * SHIP_THRUST * dt;
      ship.vy += Math.sin(ship.angle) * SHIP_THRUST * dt;
      const speed = Math.hypot(ship.vx, ship.vy);
      if (speed > SHIP_MAX_SPEED) {
        ship.vx = (ship.vx / speed) * SHIP_MAX_SPEED;
        ship.vy = (ship.vy / speed) * SHIP_MAX_SPEED;
      }
    }

    ship.vx *= SHIP_FRICTION;
    ship.vy *= SHIP_FRICTION;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    wrapPosition(ship);

    if (keys.shoot) fireBullet();

    bullets = bullets.filter((bullet) => {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      wrapPosition(bullet);
      return bullet.life > 0;
    });

    for (const asteroid of asteroids) {
      asteroid.x += asteroid.vx * dt;
      asteroid.y += asteroid.vy * dt;
      wrapPosition(asteroid);
    }

    for (let b = bullets.length - 1; b >= 0; b--) {
      const bullet = bullets[b];
      for (let a = asteroids.length - 1; a >= 0; a--) {
        const asteroid = asteroids[a];
        if (circleHit(bullet.x, bullet.y, 2, asteroid.x, asteroid.y, asteroid.radius)) {
          bullets.splice(b, 1);
          destroyAsteroid(a);
          break;
        }
      }
    }

    if (ship.invulnerable > 0) {
      ship.invulnerable -= dt;
    } else {
      for (const asteroid of asteroids) {
        if (circleHit(ship.x, ship.y, SHIP_SIZE * 0.6, asteroid.x, asteroid.y, asteroid.radius)) {
          loseLife();
          break;
        }
      }
    }
  }

  function drawShip() {
    if (ship.invulnerable > 0 && Math.floor(ship.invulnerable * 10) % 2 === 0) return;

    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = COLORS.ship;
    ctx.beginPath();
    ctx.moveTo(SHIP_SIZE, 0);
    ctx.lineTo(-SHIP_SIZE * 0.7, SHIP_SIZE * 0.55);
    ctx.lineTo(-SHIP_SIZE * 0.4, 0);
    ctx.lineTo(-SHIP_SIZE * 0.7, -SHIP_SIZE * 0.55);
    ctx.closePath();
    ctx.fill();

    if (ship.thrusting) {
      ctx.fillStyle = '#e8975d';
      ctx.beginPath();
      ctx.moveTo(-SHIP_SIZE * 0.5, 0);
      ctx.lineTo(-SHIP_SIZE * 1.1, SHIP_SIZE * 0.25);
      ctx.lineTo(-SHIP_SIZE * 1.1, -SHIP_SIZE * 0.25);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);

    ctx.strokeStyle = '#19212b';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, PLAY_WIDTH - 1, PLAY_HEIGHT - 1);

    for (const asteroid of asteroids) {
      ctx.strokeStyle = COLORS.asteroid;
      ctx.lineWidth = 2;
      ctx.beginPath();
      asteroid.vertices.forEach((vertex, index) => {
        const x = asteroid.x + vertex.x;
        const y = asteroid.y + vertex.y;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    }

    ctx.fillStyle = COLORS.bullet;
    for (const bullet of bullets) {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    drawShip();

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
            : 'Game Over';

      ctx.fillText(message, PLAY_WIDTH / 2, PLAY_HEIGHT / 2 - 14);
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText(
        state === 'gameover' ? `Score: ${score}` : 'Use on-screen buttons or arrows',
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

  function onKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();

    if (key === ' ' || key === 'enter') {
      event.preventDefault();
      startOrContinue();
      return;
    }

    if (key === 'p' && (state === 'playing' || state === 'paused')) {
      event.preventDefault();
      setState(state === 'playing' ? 'paused' : 'playing');
      return;
    }

    if (key === 'arrowleft') keys.left = true;
    else if (key === 'arrowright') keys.right = true;
    else if (key === 'arrowup') keys.up = true;
  }

  function onKeyUp(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft') keys.left = false;
    else if (key === 'arrowright') keys.right = false;
    else if (key === 'arrowup') keys.up = false;
  }

  function startOrContinue() {
    if (state === 'ready' || state === 'gameover') {
      resetGame();
      setState('playing');
    } else if (state === 'paused') {
      setState('playing');
    } else {
      fireBullet();
    }
  }

  const unbindTouch = bindTouchInput(canvas, {
    onTap: startOrContinue,
  });

  const destroyVirtualControls = createVirtualControls(root, {
    onLeft: (pressed) => {
      keys.left = pressed;
    },
    onRight: (pressed) => {
      keys.right = pressed;
    },
    onThrust: (pressed) => {
      keys.up = pressed;
    },
    onFire: () => {
      if (state === 'playing') fireBullet();
    },
  });

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(root);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  ship = createShip();
  resetGame();
  setState('ready');
  resizeCanvas();
  rafId = requestAnimationFrame(frame);

  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    resizeObserver.disconnect();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    unbindTouch();
    destroyVirtualControls();
    root.innerHTML = '';
  };
}
