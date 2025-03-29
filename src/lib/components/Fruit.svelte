<script>
  import { FRUITS } from '../constants';

  let { x = 0, y = 0, rotation = 0, fruitIndex = 0 } = $props();

  let fruit = $derived(FRUITS[fruitIndex]);
</script>

<div
  class="fruit"
  style="
    --x: {x}px;
    --y: {y}px;
    --rotation: {rotation}rad;
    --size: {fruit.radius * 2}px;
    --color: {fruit.color};
    background-image: url('/fruits/{fruit.name}.png');
    background-size: 100%;
  ">
</div>

<style>
  .fruit {
    position: absolute;
    width: var(--size);
    height: var(--size);
    transform: translate(
        calc(var(--x) - var(--size) / 2),
        calc(var(--y) - var(--size) / 2)
      )
      rotate(var(--rotation));
    user-select: none;
  }
</style>
