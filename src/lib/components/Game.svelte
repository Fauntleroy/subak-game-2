<script lang="ts">
  // Import Svelte utilities and types
  import { onDestroy, onMount } from "svelte";
  import type { Writable } from "svelte/store"; // Import Writable type if needed elsewhere

  // Import Components
  import Fruit from "./Fruit.svelte";
  import ScoreBoard from "./ScoreBoard.svelte";
  import MergeEffect from "./MergeEffect.svelte";

  // Import Stores and Types
  import { gameState } from "../stores/game.svelte";
  import { saveScore } from "../stores/db"; // Assuming saveScore is typed in db.ts

  // Import Constants and Types
  import { GAME_WIDTH, GAME_HEIGHT, FRUITS } from "../constants"; // Ensure FRUITS is typed in constants.ts

  // Import Utilities
  import { clamp } from "../utils"; // Assuming clamp is typed in utils.ts

  // --- Component State ---

  // Type the container element reference
  let gameContainer: HTMLDivElement | null = null;
  // Type the animation frame ID
  let animationFrame: number | undefined = undefined;

  // Svelte 5 runes for state
  let isDropping = $state(false);
  let mouseX = $state(GAME_WIDTH / 2);

  // --- Reactive Effects ---

  // Initialize physics and start animation loop on mount
  // Use onMount/onDestroy for clearer lifecycle management with requestAnimationFrame
  onMount(() => {
    let isActive = true; // Flag to prevent callbacks after component destruction

    // Cleanup function
    return () => {
      isActive = false; // Set flag
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = undefined;
      }
      console.log("Game component destroyed, animation stopped.");
      // Optional: Consider if physics world needs explicit cleanup here
    };
  });

  // Save score when game is over
  $effect(() => {
    if (gameState.gameOver) {
      // Ensure score is a number before saving
      if (typeof gameState.score === "number") {
        saveScore(gameState.score);
      } else {
        console.error("Attempted to save invalid score:", gameState.score);
      }
    }
  });

  // --- Event Handlers ---

  // Handle clicking/tapping to drop a fruit
  function handleClick(event: MouseEvent | TouchEvent): void {
    if (gameState.gameOver || isDropping || !gameContainer) return;

    const rect = gameContainer.getBoundingClientRect();
    let clientX: number;

    // Handle both mouse and touch events
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
    } else if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
    } else {
      return; // Ignore if event type is unexpected
    }

    const x = clientX - rect.left;
    const currentFruitRadius = FRUITS[gameState.currentFruit]?.radius ?? 0; // Safety check
    const clampedX = clamp(
      x,
      currentFruitRadius,
      GAME_WIDTH - currentFruitRadius
    );

    isDropping = true;
    gameState.addFruit(
      clampedX,
      FRUITS[gameState.currentFruit]?.radius ?? 25,
      gameState.currentFruit
    ); // Use radius for initial Y

    // Select next fruits
    gameState.setCurrentFruit(gameState.nextFruit);
    gameState.setNextFruit(Math.floor(Math.random() * 3));

    // Prevent dropping too quickly
    setTimeout(() => {
      isDropping = false;
    }, 500); // Cooldown duration
  }

  // Handle mouse/touch movement to position the preview fruit
  function handlePointerMove(event: MouseEvent | TouchEvent): void {
    if (gameState.gameOver || isDropping || !gameContainer) return;

    const rect = gameContainer.getBoundingClientRect();
    let clientX: number;

    // Handle both mouse and touch events
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
    } else if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
    } else {
      return; // Ignore if event type is unexpected
    }

    const x = clientX - rect.left;
    const currentFruitRadius = FRUITS[gameState.currentFruit]?.radius ?? 0; // Safety check

    // Update mouseX state, clamped within bounds
    mouseX = clamp(x, currentFruitRadius, GAME_WIDTH - currentFruitRadius);
  }

  // Handle keyboard interaction for dropping fruit (Accessibility)
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      // Use current mouseX position for keyboard drop
      const currentFruitRadius = FRUITS[gameState.currentFruit]?.radius ?? 0;
      const dropX = clamp(
        mouseX,
        currentFruitRadius,
        GAME_WIDTH - currentFruitRadius
      );

      // Simulate a click event at the current mouseX position
      // We need to create a mock event or directly call the drop logic
      if (gameState.gameOver || isDropping) return;

      isDropping = true;
      gameState.addFruit(
        dropX,
        FRUITS[gameState.currentFruit]?.radius ?? 25,
        gameState.currentFruit
      );

      gameState.setCurrentFruit(gameState.nextFruit);
      gameState.setNextFruit(Math.floor(Math.random() * 3));

      setTimeout(() => {
        isDropping = false;
      }, 500);

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
  class="game-wrapper"
  onpointermove={handlePointerMove}
  onpointerdown={handleClick}
  onkeydown={handleKeyDown}
  role="application"
  aria-label="Fruit merging game area"
  tabindex="0"
>
  <!-- Game Info Header -->
  <div class="game-info" style="max-width: {GAME_WIDTH}px">
    <div class="next-fruit" aria-live="polite">
      <!-- Use aria-live for screen readers to announce changes -->
      Next: {FRUITS[gameState.nextFruit]?.name ?? "Unknown"}
      <!-- Safety check for name -->
    </div>
    <div class="score" aria-live="polite">
      Score: {gameState.score}
    </div>
  </div>

  <!-- Game Container -->
  <div
    class="game-container"
    bind:this={gameContainer}
    style="width: {GAME_WIDTH}px; height: {GAME_HEIGHT}px;"
    aria-hidden="true"
  >
    <!-- Removed click handler here, moved to wrapper -->
    <!-- aria-hidden because the wrapper handles interaction -->

    <!-- Merge effects - Use effect.id as the key -->
    {#each gameState.mergeEffects as effect (effect.id)}
      <MergeEffect {...effect} />
    {/each}

    <!-- Preview fruit - Appears when not dropping -->
    {#if !gameState.gameOver && !isDropping}
      <div
        class="preview-fruit"
        aria-hidden="true"
        style="transform: translateX({mouseX -
          (FRUITS[gameState.currentFruit]?.radius ?? 0)}px);"
      >
        <!-- Position using transform for potentially better performance -->
        <!-- aria-hidden as it's purely visual feedback -->
        <Fruit
          x={FRUITS[gameState.currentFruit]?.radius ?? 0}
          y={FRUITS[gameState.currentFruit]?.radius ?? 0}
          fruitIndex={gameState.currentFruit}
        />
      </div>
    {/if}

    <!-- Rendered fruits - Use a unique identifier if available, otherwise index -->
    <!-- Assuming FruitState doesn't have a stable ID, index might be necessary -->
    <!-- If FruitState *does* get an ID (e.g., collider handle), use fruit.id -->
    {#each gameState.fruits as fruit, i (i)}
      <Fruit {...fruit} />
    {/each}

    <!-- Game Over Overlay -->
    {#if gameState.gameOver}
      <!-- Use role="alertdialog" for better semantics -->
      <div
        class="game-over"
        role="alertdialog"
        aria-labelledby="gameOverHeading"
      >
        <h2 id="gameOverHeading">Game Over!</h2>
        <p>Final Score: {gameState.score}</p>
        <!-- Ensure button is focusable -->
        <button onclick={() => gameState.resetGame()}>Play Again</button>
      </div>
    {/if}
  </div>

  <!-- ScoreBoard Component -->
  <ScoreBoard />
</div>

<style>
  .game-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    user-select: none; /* Prevent text selection */
    touch-action: none; /* Prevent default touch actions like scrolling */
    outline: none; /* Remove default focus outline if desired, but ensure custom focus style */
  }

  /* Add focus style for accessibility */
  .game-wrapper:focus-visible {
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.6); /* Example focus ring */
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
    /* Removed cursor: pointer as interaction is on wrapper */
    user-select: none;
  }

  .preview-fruit {
    position: absolute;
    top: 0;
    left: 0; /* Left is now fixed, use transform for horizontal positioning */
    /* width: 100%; */ /* Width is determined by the fruit component */
    pointer-events: none; /* Prevent interaction */
    z-index: 1;
    /* Transition for smoother movement */
    transition: transform 0.05s linear;
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
