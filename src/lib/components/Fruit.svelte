<script>
  import { FRUITS } from '../constants';

  let { size = null, fruitIndex = 0, scale = 1 } = $props();

  let fruit = $derived(FRUITS[fruitIndex]);
</script>

<div
  class="fruit"
  style:width={size ?? `${fruit.radius * 2 * scale}px`}
  style:background-image={`url('/fruits/${fruit.name}.png')`}>
</div>

<style>
  .fruit {
    aspect-ratio: 1 / 1;
    user-select: none;
    background-size: 100%;
  }
</style>
