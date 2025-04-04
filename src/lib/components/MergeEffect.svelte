<script>
  let { radius, scale, opacity } = $props();
</script>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<div
  class="merge-effect"
  style:width={`${radius * 2}px`}
  style:scale
  style:opacity />

<style>
  .merge-effect {
    aspect-ratio: 1 / 1;
    border-radius: 50%;
    border: 1px solid rgb(128, 128, 128);
  }
</style>
