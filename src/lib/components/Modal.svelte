<script lang="ts">
  // --- Props ---
  // `open`: Controls the visibility of the modal (bindable)
  // `onClose`: Callback function triggered when the modal requests to be closed
  // `children`: Slot content for the modal body
  let { open = false, onClose = () => {}, children } = $props();

  // --- State ---
  // Reference to the dialog DOM element
  let dialogRef: HTMLDialogElement | null = $state(null);

  // --- Effects ---
  // Effect to synchronize the `open` prop with the dialog's state
  $effect(() => {
    const dialog = dialogRef;
    if (!dialog) return; // Wait for the element to be bound

    if (open && !dialog.open) {
      // Prop says open, but dialog isn't -> open it
      dialog.show(); // Use showModal() for proper modal behavior (incl. ESC)
    } else if (!open && dialog.open) {
      // Prop says closed, but dialog is open -> close it
      dialog.close();
    }
  });

  // Effect to listen for the native 'close' event on the dialog
  // This handles closing via the ESC key or internal dialog mechanisms
  $effect(() => {
    const dialog = dialogRef;
    if (!dialog) return;

    const handleNativeClose = () => {
      // When the dialog closes natively (e.g., ESC),
      // call the onClose prop to notify the parent.
      // This keeps the parent's `open` state in sync.
      if (open) {
        // Only trigger if it was supposed to be open
        onClose();
      }
    };

    dialog.addEventListener('close', handleNativeClose);

    // Cleanup listener when the component unmounts or dialogRef changes
    return () => {
      dialog.removeEventListener('close', handleNativeClose);
    };
  });

  // --- Functions ---
  // Function to request closing the modal (used by button and backdrop)
  function requestClose() {
    // Call the provided callback; the parent component is responsible
    // for actually changing the `open` prop to false.
    onClose();
  }
</script>

<!-- Custom Backdrop: Only rendered when the modal should be open -->
{#if open}
  <div class="custom-backdrop" onclick={requestClose} aria-hidden="true"></div>
{/if}

<!-- The Dialog Element -->
<dialog bind:this={dialogRef}>
  <div class="modal-content">
    <!-- Close Button -->
    <button
      class="close-button"
      onclick={requestClose}
      aria-label="Close dialog">
      &times; <!-- Multiplication sign often used for 'close' -->
    </button>

    <!-- Slot for user content -->
    {@render children()}
  </div>
</dialog>

<style>
  .custom-backdrop {
    position: absolute;
    inset: 0; /* Cover entire viewport */
    background-color: var(--color-background); /* 50% opaque white */
    opacity: 0.9;
    backdrop-filter: blur(10px);
    z-index: 10; /* Ensure it's below the dialog */
  }

  dialog {
    /* Reset browser defaults */
    padding: 0;
    border: none;
    background: var(--color-background-light);
    color: var(--color-text); /* Or your desired modal background */
    border-radius: 8px; /* Optional: rounded corners */
    box-shadow: hsla(0, 0%, 0%, 0.2) 0 2px 2px;

    /* Positioning and Sizing */
    position: absolute; /* Needed for z-index and centering */
    inset: 0;
    z-index: 20; /* Ensure it's above the backdrop */
    margin: auto; /* Center horizontally and vertically */
    max-width: calc(100% - 4em); /* Ensure at least 2em margin on sides */
    max-height: calc(100% - 4em); /* Ensure at least 2em margin top/bottom */
    overflow: auto; /* Allow scrolling if content exceeds size */

    /* Optional: Add transition/animation */
    opacity: 0;
    transform: scale(0.95);
    transition:
      opacity 0.2s ease-out,
      transform 0.2s ease-out;
  }

  /* Style when the dialog is open */
  dialog[open] {
    opacity: 1;
    transform: scale(1);
  }

  /* Hide the default ::backdrop pseudo-element provided by <dialog> */
  dialog::backdrop {
    display: none;
  }

  .modal-content {
    padding: 1.5em; /* Internal padding for content */
    position: relative; /* Needed for absolute positioning of close button */
  }

  .close-button {
    position: absolute;
    top: 0.5em;
    right: 0.5em;
    background: none;
    border: none;
    font-size: 1.8em;
    line-height: 1;
    cursor: pointer;
    padding: 0.2em;
    color: #666;
    transition: color 0.2s;
  }

  .close-button:hover {
    color: #000;
  }

  /* Ensure dialog is not displayed when closed, overriding potential user-agent styles */
  dialog:not([open]) {
    display: none;
  }
</style>
