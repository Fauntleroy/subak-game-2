<script>
  let { x, y, radius, scale, opacity, positionScale = 1 } = $props();
</script>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<div
  class="merge-effect"
  style="
    --x: {x * positionScale}px;
    --y: {y * positionScale}px;
    --size: {radius * 2 * positionScale}px;
    --scale: {scale};
    --opacity: {opacity};
  " />

<style>
  .merge-effect {
    position: absolute;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    border: 1px solid rgba(128, 128, 128, var(--opacity));
    transform: translate(
        calc(var(--x) - var(--size) / 2),
        calc(var(--y) - var(--size) / 2)
      )
      scale(var(--scale));
    pointer-events: none;
    z-index: 0;
  }
</style>
