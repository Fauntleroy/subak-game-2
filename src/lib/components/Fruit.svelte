<script>
  let { radius, name } = $props();
</script>

<div
  class="fruit"
  style:width="{radius * 2}px"
  style:background-image="url('/fruits/{name}.png')">
</div>

<style>
  .fruit {
    aspect-ratio: 1 / 1;
    user-select: none;
    background-size: 100%;
  }
</style>
