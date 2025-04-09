<script lang="ts">
  interface FruitProps {
    radius: number | string;
    name: string;
    display?: 'block' | 'inline';
  }

  let { radius, name, display = 'block' }: FruitProps = $props();

  const width = $derived.by(() => {
    return Number.isFinite(radius) ? `${(radius as number) * 2}px` : radius;
  });
</script>

<div
  class="fruit"
  style:width
  style:background-image="url('/fruits/{name}.png')"
  style:display={display === 'inline' ? 'inline-block' : display}>
</div>

<style>
  .fruit {
    aspect-ratio: 1 / 1;
    user-select: none;
    background-size: 100%;
  }
</style>
