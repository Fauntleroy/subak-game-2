<script>
  import { FRUITS } from "../constants";

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
  "
>
  {fruit.name}
</div>

<style>
  .fruit {
    position: absolute;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    background-color: var(--color);
    transform: translate(
        calc(var(--x) - var(--size) / 2),
        calc(var(--y) - var(--size) / 2)
      )
      rotate(var(--rotation));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 8px;
    font-weight: normal;
    text-transform: uppercase;
    user-select: none;
  }
</style>
