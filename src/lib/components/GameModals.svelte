<!-- App.svelte -->
<script>
  import { gameState } from '../stores/game.svelte';
  import Modal from './Modal.svelte';

  import SoundOn from '../icons/sound-on.svelte';
  import SoundOff from '../icons/sound-off.svelte';

  let showModal = $state(false);

  function openMyModal() {
    showModal = true;
  }

  function closeMyModal() {
    showModal = false;
  }

  function handleMuteClick() {
    gameState.audioManager.toggleMute();
  }
</script>

<footer class="control-bar">
  <button onclick={openMyModal}>Open Modal</button>

  {#if showModal}
    <Modal open={showModal} onclose={closeMyModal}>
      <h2>Hello from the Modal!</h2>
      <p>This is the content inside the modal dialog.</p>
      <p>
        You can close it using the 'X' button, clicking the background, or
        pressing the ESC key.
      </p>
      <button onclick={closeMyModal}>Close from inside</button>
    </Modal>
  {/if}

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
