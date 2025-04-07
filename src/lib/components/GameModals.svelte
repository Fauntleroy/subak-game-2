<!-- App.svelte -->
<script>
  import { gameState } from '../stores/game.svelte';
  import Modal from './Modal.svelte';

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

  <button onclick={handleMuteClick}>🔇</button>
</footer>

<style>
  .control-bar {
    padding: 0.5em;
    border-top: var(--color-border) 1px solid;
  }
</style>
