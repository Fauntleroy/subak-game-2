<!-- App.svelte -->
<script>
  import { gameState } from '../stores/game.svelte';
  import Modal from './Modal.svelte';

  import SoundOn from '../icons/sound-on.svelte';
  import SoundOff from '../icons/sound-off.svelte';
  import LeaderboardModal from './LeaderboardModal.svelte';
  import IntroductionModal from './IntroductionModal.svelte';

  let showModal = $state(false);
  let showIntroduction = $state(true);

  function openMyModal() {
    showModal = true;
  }

  function closeMyModal() {
    showModal = false;
  }

  function handleLeaderBoardButtonClick() {
    showIntroduction = true;
  }

  function handleCloseIntroduction() {
    showIntroduction = false;
  }

  function handleMuteClick() {
    gameState.audioManager.toggleMute();
  }
</script>

<footer class="control-bar">
  <button onclick={handleLeaderBoardButtonClick}>About</button>
  <IntroductionModal
    open={showIntroduction}
    onClose={handleCloseIntroduction} />

  <button onclick={openMyModal}>Leaderboard</button>
  <LeaderboardModal open={showModal} onClose={closeMyModal} />

  <button onclick={handleMuteClick}>
    {#if gameState.audioManager?.isMuted}
      <SoundOff />
    {:else}
      <SoundOn />
    {/if}
  </button>
</footer>

<style>
  .control-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    padding: 0.5em;
  }
</style>
