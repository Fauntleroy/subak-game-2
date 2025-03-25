<script>
  import Fruit from "./Fruit.svelte";
  import ScoreBoard from "./ScoreBoard.svelte";
  import MergeEffect from "./MergeEffect.svelte";

  import {
    initPhysics,
    step,
    addFruit,
    resetGame,
    score,
    gameOver,
    currentFruit,
    nextFruit,
    fruits,
    mergeEffects,
  } from "../stores/game";
  import { saveScore } from "../stores/db";
  import { GAME_WIDTH, GAME_HEIGHT, FRUITS } from "../constants";
  import { clamp } from "../utils";

  let gameContainer;
  let animationFrame;
  let isDropping = $state(false);
  let mouseX = $state(GAME_WIDTH / 2);

  $effect(async () => {
    await initPhysics();
    resetGame();
    const animateLoop = () => {
      step();
      animationFrame = requestAnimationFrame(animateLoop);
    };
    animateLoop();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  });

  function handleClick(event) {
    if ($gameOver || isDropping) return;

    const rect = gameContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;

    isDropping = true;
    addFruit(x, 0, $currentFruit);

    $currentFruit = $nextFruit;
    $nextFruit = Math.floor(Math.random() * 3);

    setTimeout(() => {
      isDropping = false;
    }, 500);
  }

  function handleMouseMove(event) {
    if ($gameOver || isDropping) return;

    const rect = gameContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const currentFruitRadius = FRUITS[$currentFruit].radius;

    mouseX = clamp(x, currentFruitRadius, GAME_WIDTH - currentFruitRadius);
  }

  $effect(() => {
    if ($gameOver) {
      saveScore($score);
    }
  });
</script>

<div class="game-wrapper" on:mousemove={handleMouseMove}>
  <div class="game-info" style="max-width: {GAME_WIDTH}px">
    <div class="next-fruit">
      Next: {FRUITS[$nextFruit].name}
    </div>
    <div class="score">
      Score: {$score}
    </div>
  </div>

  <div
    class="game-container"
    bind:this={gameContainer}
    on:click={handleClick}
    style="width: {GAME_WIDTH}px; height: {GAME_HEIGHT}px;"
  >
    <!-- Merge effects -->
    {#each $mergeEffects as effect}
      <MergeEffect {...effect} />
    {/each}

    <!-- Preview fruit -->
    {#if !$gameOver && !isDropping}
      <div class="preview-fruit">
        <Fruit
          x={mouseX}
          y={FRUITS[$currentFruit].radius}
          fruitIndex={$currentFruit}
        />
      </div>
    {/if}

    {#each $fruits as fruit (fruit)}
      <Fruit {...fruit} />
    {/each}

    {#if $gameOver}
      <div class="game-over">
        <h2>Game Over!</h2>
        <p>Final Score: {$score}</p>
        <button on:click={resetGame}>Play Again</button>
      </div>
    {/if}
  </div>

  <ScoreBoard />
</div>

<style>
  .game-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    user-select: none;
  }

  .game-info {
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-size: 1.2rem;
    font-weight: bold;
  }

  .game-container {
    position: relative;
    background: #f0f0f0;
    border: 2px solid #333;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    user-select: none;
  }

  .preview-fruit {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    pointer-events: none;
    z-index: 1;
  }

  .game-over {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 2rem;
    border-radius: 8px;
    text-align: center;
  }

  button {
    background: #4caf50;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.1rem;
  }

  button:hover {
    background: #45a049;
  }
</style>
