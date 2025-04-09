<script lang="ts">
  import { quadOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  import { gameState } from '../stores/game.svelte';

  import Fruit from './Fruit.svelte';
  import CircleOfEvolution from './CircleOfEvolution.svelte';

  import { FRUITS } from '../constants';
  import InterpolatingNumber from './InterpolatingNumber.svelte';

  let nextFruit = $derived(FRUITS[gameState.nextFruitIndex]);
</script>

<div class="game-sidebar">
  <section class="section" aria-live="polite">
    <!-- Use aria-live for screen readers to announce changes -->
    <h5 class="section__heading">Next</h5>
    <div class="next-fruit">
      {#key gameState.dropCount}
        <div
          class="next-fruit-wrapper"
          in:fly={{ delay: 450, easing: quadOut, duration: 250, x: -50 }}
          out:fly={{ delay: 250, easing: quadOut, duration: 250, x: 50 }}>
          <Fruit radius={25} name={nextFruit.name} />
        </div>
      {/key}
    </div>
    <!-- Safety check for name -->
  </section>
  <section class="section" aria-live="polite">
    <h5 class="section__heading">Score</h5>
    <var class="score"><InterpolatingNumber number={gameState.score} /></var>
  </section>
  <section class="section">
    <h5 class="section__heading">Cycle</h5>
    <CircleOfEvolution />
  </section>
</div>

<style>
  .game-sidebar {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    gap: 1em;
    padding: 1em;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.75em;
  }

  .section__heading {
    margin: 0;
    font-size: 1em;
    text-transform: uppercase;
    letter-spacing: 10%;
  }

  .next-fruit {
    display: grid;
    grid-template-areas: 'main';
    align-items: center;
    justify-items: center;
    box-shadow:
      inset 0px 0px 5px 0px rgba(0, 0, 0, 0.125),
      inset 0 2px 0px 0px rgba(0, 0, 0, 0.1);
    background-color: rgba(0, 0, 0, 0.025);
    border-radius: 2em;
    padding: 0.75em 1em;
    overflow: hidden;
  }

  .next-fruit-wrapper {
    grid-area: main;
  }

  .score {
    display: block;
    font-family: monospace;
    font-style: normal;
    font-weight: 250;
    font-size: 1.5em;
    border: var(--color-border-light) 1px solid;
    border-radius: 1em;
    padding: 0.125em 0.5em;
  }

  @media (max-width: 600px) {
    .game-sidebar {
      font-size: 14px;
    }

    .next-fruit-wrapper {
      max-width: 35px;
      display: flex;
    }
  }
</style>
