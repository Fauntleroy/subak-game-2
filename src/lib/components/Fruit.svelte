<script>
  import { FRUITS } from '../constants';

  let {
    x = 0,
    y = 0,
    size = null,
    rotation = 0,
    fruitIndex = 0,
    scale = 1,
    position = 'absolute'
  } = $props();

  let fruit = $derived(FRUITS[fruitIndex]);
  const translateX = $derived(x * scale - fruit.radius * scale);
  const translateY = $derived(y * scale - fruit.radius * scale);
  const isStatic = position === 'static';
</script>

<div
  class="fruit"
  style:position
  style:translate={isStatic ? '' : `${translateX}px ${translateY}px`}
  style:rotate={`${rotation}rad`}
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
