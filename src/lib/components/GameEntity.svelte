<script>
  let { x = 0, y = 0, rotation = 0, scale = 1, children } = $props();

  const translateX = $derived(x * scale);
  const translateY = $derived(y * scale);
</script>

<div
  class="game-entity"
  style:translate="calc(-50% + {translateX}px) calc(-50% + {translateY}px)"
  style:rotate="{rotation}rad">
  {@render children()}
</div>

<style>
  .game-entity {
    position: absolute;
    will-change: translate, rotate;
  }
</style>
