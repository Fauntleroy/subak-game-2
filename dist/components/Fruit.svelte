<script lang="ts">
  import { GAME_WIDTH, GAME_WIDTH_PX, IMAGES_PATH } from '../constants';

  interface FruitProps {
    radius: number | string;
    name: string;
    display?: 'block' | 'inline';
    scale?: number;
  }

  let { radius, name, display = 'block', scale = 1 }: FruitProps = $props();

  const width = $derived.by(() => {
    const scaledGameWidthPx = GAME_WIDTH_PX * scale;

    return Number.isFinite(radius)
      ? `${(((radius as number) * 2) / GAME_WIDTH) * scaledGameWidthPx}px`
      : radius;
  });
</script>

<div
  class="fruit"
  style:width
  style:background-image="url('{IMAGES_PATH}/fruits/{name}.png')"
  style:display={display === 'inline' ? 'inline-block' : display}>
</div>

<style>
  .fruit {
    aspect-ratio: 1 / 1;
    user-select: none;
    background-size: 100%;
  }
</style>
