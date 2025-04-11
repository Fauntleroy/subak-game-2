<script lang="ts">
  import { scale } from 'svelte/transition';
  import { expoOut } from 'svelte/easing';

  // Import Components
  import Fruit from './Fruit.svelte';
  import MergeEffect from './MergeEffect.svelte';

  // Import Stores and Types
  import { gameState } from '../stores/game.svelte';
  import { saveScore } from '../stores/db';

  // Import Constants and Types
  import { GAME_WIDTH, GAME_OVER_HEIGHT, FRUITS } from '../constants';

  // Import Utilities
  import { clamp } from '../utils';
  import { useCursorPosition } from '../hooks/useCursorPosition.svelte';
  import { useBoundingRect } from '../hooks/useBoundingRect.svelte';
  import GameEntity from './GameEntity.svelte';
  import GameSidebar from './GameSidebar.svelte';
  import GameHeader from './GameHeader.svelte';

  // Find game area width and cursor position
  let gameRef = $state<HTMLElement | null>(null);
  let gameBoundingRect = useBoundingRect();
  let cursorPosition = useCursorPosition();

  $effect(() => {
    cursorPosition.ref = gameRef;
    gameBoundingRect.ref = gameRef;
  });

  // Find fruit data
  let currentFruit = $derived(FRUITS[gameState.currentFruitIndex]);

  // Find game scale
  let gameScale = $derived.by(() => {
    const gameWidth = gameBoundingRect?.rect?.width || GAME_WIDTH;
    return gameWidth / GAME_WIDTH;
  });

  let isDropping = $state(false);

  let clampedMouseX: number = $derived.by(() => {
    const currentFruitRadius = currentFruit?.radius ?? 0; // Safety check
    const scaledRadius = currentFruitRadius * gameScale;
    const scaledWidth = GAME_WIDTH * gameScale;
    // Update mouseX state, clamped within bounds
    return clamp(cursorPosition.x, scaledRadius, scaledWidth - scaledRadius);
  });

  // Save score when game is over
  $effect(() => {
    if (gameState.gameOver) {
      // Ensure score is a number before saving
      if (typeof gameState.score === 'number') {
        saveScore(gameState.score);
      } else {
        console.error('Attempted to save invalid score:', gameState.score);
      }
    }
  });

  function dropCurrentFruit() {
    if (gameState.gameOver || isDropping) return;

    // const currentFruit = FRUITS[gameState.currentFruitIndex];

    isDropping = true;
    gameState.dropFruit(
      gameState.currentFruitIndex,
      clampedMouseX / gameScale,
      GAME_OVER_HEIGHT / 2
    );

    // Prevent dropping too quickly
    setTimeout(() => {
      isDropping = false;
    }, 500); // Cooldown duration
  }

  // --- Event Handlers ---

  // Handle clicking/tapping to drop a fruit
  function handleClick(): void {
    dropCurrentFruit();
  }

  // Handle keyboard interaction for dropping fruit (Accessibility)
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      dropCurrentFruit();

      event.preventDefault(); // Prevent default spacebar scroll
    }
  }
</script>

<!--
  Disable specific a11y rules for this div because:
  1. role="application" correctly identifies it as a complex interactive widget.
  2. tabindex="0" makes it focusable.
  3. Keyboard and pointer event listeners provide the necessary interaction.
  This pattern is appropriate for custom game-like interfaces.
-->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="game"
  role="application"
  aria-label="Fruit merging game area"
  tabindex="0">
  <div class="header"><GameHeader /></div>
  <div class="sidebar"><GameSidebar /></div>

  <!-- Game Container -->
  <div
    class="gameplay-area"
    bind:this={gameRef}
    onpointerdown={handleClick}
    onkeydown={handleKeyDown}
    aria-hidden="true">
    <!-- aria-hidden because the wrapper handles interaction -->

    <div class="restricted-area"></div>

    <div class="drop-line" style:translate="{clampedMouseX - 1}px 0"></div>

    <!-- Merge effects - Use effect.id as the key -->
    {#each gameState.mergeEffects as effect (effect.id)}
      <GameEntity x={effect.x} y={effect.y} scale={gameScale}>
        <MergeEffect {...effect} radius={effect.radius * gameScale} />
      </GameEntity>
    {/each}

    <!-- Preview fruit - Appears when not dropping -->
    {#if !gameState.gameOver && !isDropping && currentFruit}
      <div
        class="preview-fruit"
        aria-hidden="true"
        style:translate="{clampedMouseX}px 0"
        in:scale={{ opacity: 1, easing: expoOut, duration: 250 }}>
        <!-- aria-hidden as it's purely visual feedback -->
        <GameEntity x={0} y={GAME_OVER_HEIGHT / 2} scale={gameScale}>
          <Fruit {...currentFruit} radius={currentFruit.radius * gameScale} />
        </GameEntity>
      </div>
    {/if}

    <!-- Rendered fruits - Use a unique identifier if available, otherwise index -->
    <!-- Assuming FruitState doesn't have a stable ID, index might be necessary -->
    <!-- If FruitState *does* get an ID (e.g., collider handle), use fruit.id -->
    {#each gameState.fruitsState as fruitState, i (i)}
      {@const fruit = FRUITS[fruitState.fruitIndex]}
      <GameEntity
        x={fruitState.x}
        y={fruitState.y}
        rotation={fruitState.rotation}
        scale={gameScale}>
        <Fruit {...fruit} radius={fruit.radius * gameScale} />
      </GameEntity>
    {/each}

    <!-- Game Over Overlay -->
    {#if gameState.gameOver}
      <!-- Use role="alertdialog" for better semantics -->
      <div
        class="game-over"
        role="alertdialog"
        aria-labelledby="gameOverHeading">
        <h2 id="gameOverHeading">Game Over!</h2>
        <p>Final Score: {gameState.score}</p>
        <!-- Ensure button is focusable -->
        <button onclick={() => gameState.restartGame()}>Play Again</button>
      </div>
    {/if}
  </div>

  <!-- ScoreBoard Component -->
  <!-- <ScoreBoard /> -->
</div>

<style>
  .game {
    --color-border: hsl(0, 0%, 75%);
    --color-border-light: hsl(0, 0%, 82.5%);
    --color-background: hsl(0, 0%, 92.5%);
    --color-background-light: hsl(0, 0%, 99%);
    --color-text: hsl(0, 0%, 20%);
    --color-light-text: hsl(0, 0%, 35%);
    --color-very-light-text: hsl(0, 0%, 50%);
    --border-radius: 1em;

    display: grid;
    grid-template-columns: minmax(100px, 150px) minmax(200px, 600px);
    grid-template-areas: 'header header' 'sidebar gameplay';
    width: fit-content;

    position: relative;
    overflow: hidden;

    user-select: none; /* Prevent text selection */
    touch-action: none; /* Prevent default touch actions like scrolling */
    outline: none; /* Remove default focus outline if desired, but ensure custom focus style */
    background: var(--color-background);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);

    font-size: 16px;
    font-family: Inter, sans-serif;
    font-optical-sizing: auto;
    font-style: normal;
    font-weight: 400;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 100;
      pointer-events: none;
      opacity: 0.25;
      mix-blend-mode: color-dodge;
    }

    :global(b, strong, h1, h2, h3, h4, h5, h6) {
      font-weight: 550;
    }

    :global(button) {
      font-size: 1em;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 2em;
      background: var(--color-background);
      border: none;
      border-radius: 0.5em;
      padding: 0.25em 0.75em;
      color: var(--color-text);
      box-shadow:
        0px 2px 5px 0px rgba(0, 0, 0, 0.125),
        0 2px 0px 0px rgba(0, 0, 0, 0.1);
      cursor: pointer;

      &:hover {
        background: var(--color-background-light);
      }
    }

    :global(var) {
      font-family: 'Azeret Mono', monospace;
      font-optical-sizing: auto;
      font-style: normal;
    }

    @media screen and (max-width: 420px) {
      grid-template-columns: 1fr;
      grid-template-areas: 'header' 'sidebar' 'gameplay';
    }
  }

  /* Add focus style for accessibility */
  .game:focus-visible {
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.6); /* Example focus ring */
  }

  .gameplay-area {
    min-width: 0px;
    flex-grow: 1;
    flex-shrink: 1;
    aspect-ratio: 2 / 3;
    position: relative;
    box-shadow:
      inset 0px 0px 5px 0px rgba(0, 0, 0, 0.125),
      inset 0 2px 0px 0px rgba(0, 0, 0, 0.1);
    background-color: rgba(0, 0, 0, 0.025);

    /* Removed cursor: pointer as interaction is on wrapper */
    user-select: none;
    overflow: hidden;
  }

  .restricted-area {
    position: absolute;
    top: 0;
    left: 0;
    height: 16.666%;
    width: 100%;
    border-bottom: 1px solid var(--color-border-light);
    background-image: repeating-linear-gradient(
      -45deg,
      /* Gradient direction */ var(--color-border-light) 0px,
      /* Start color from 0px */ var(--color-border-light) 1px,
      /* Color extends to 1px */ transparent 1px,
      /* Transparent starts at 1px */ transparent 15px
        /* Transparent extends to 3px (1px + 2px) */
        /* The pattern repeats every 3px */
    );
  }

  .drop-line {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
    width: 1px;
    height: 100%;
    background: var(--color-border-light);
  }

  .preview-fruit {
    position: absolute;
    top: 0;
    left: 0; /* Left is now fixed, use transform for horizontal positioning */
    /* width: 100%; */ /* Width is determined by the fruit component */
    pointer-events: none; /* Prevent interaction */
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
    z-index: 10; /* Ensure it's above other elements */
  }

  .game-over h2 {
    margin-top: 0;
  }

  .sidebar {
    grid-area: sidebar;
  }

  .header {
    grid-area: header;
    border-bottom: var(--color-border-light) 1px solid;
  }

  button {
    background: #4caf50;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.1rem;
    margin-top: 1rem;
  }

  button:hover {
    background: #45a049;
  }

  /* Add focus style for button */
  button:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }
</style>
