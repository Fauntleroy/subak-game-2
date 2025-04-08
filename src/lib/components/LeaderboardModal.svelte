<script lang="ts">
  import Modal from './Modal.svelte';

  import { getHighScores } from '../stores/db';
  import { onMount } from 'svelte';
  import Leaderboard from './Leaderboard.svelte';

  const { open, onClose } = $props();

  let highScores = $state([]);

  onMount(async () => {
    highScores = await getHighScores();
  });
</script>

<Modal {open} {onClose}>
  <h2>Leaderboard</h2>
  <Leaderboard scores={highScores} />
</Modal>
