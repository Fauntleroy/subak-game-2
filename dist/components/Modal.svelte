<script lang="ts">
  import { quadOut } from 'svelte/easing';
  import { fade, scale } from 'svelte/transition';
  // Removed: import { uniqueId } from 'lodash-es';

  // --- Module-level counter for unique IDs ---
  let popoverCounter = 0;

  // --- Props ---
  // `open`: Controls the visibility of the popover (bindable)
  // `onClose`: Callback function triggered when the popover requests to be closed
  // `children`: Slot content for the popover body
  let { open = false, onClose = () => {}, children } = $props();

  // --- State ---
  // Reference to the popover DOM element
  let popoverRef: HTMLDivElement | null = $state(null);
  // Unique ID for the popover element using the module counter
  const popoverId = `popover-${popoverCounter++}`; // Increment counter for next instance

  // --- Effects ---
  // Effect to synchronize the `open` prop with the popover's state
  $effect(() => {
    const popover = popoverRef;
    if (!popover) return; // Wait for the element to be bound

    // Check the actual current state of the popover
    const isCurrentlyOpen = popover.matches(':popover-open');

    try {
      if (open && !isCurrentlyOpen) {
        // Prop says open, but popover isn't -> show it
        popover.showPopover();
      } else if (!open && isCurrentlyOpen) {
        // Prop says closed, but popover is open -> hide it
        popover.hidePopover();
      }
    } catch (e) {
      // showPopover/hidePopover can throw if the state is already correct
      // or if called incorrectly (e.g., on non-popover element).
      // We can usually ignore these errors in this sync logic.
      // console.warn("Popover state sync error (likely harmless):", e);
    }
  });

  // Effect to listen for the native 'toggle' event on the popover
  // This handles closing via the ESC key or potential future API interactions.
  $effect(() => {
    const popover = popoverRef;
    if (!popover) return;

    const handleNativeToggle = (event: ToggleEvent) => {
      // When the popover toggles natively (e.g., ESC),
      // check if it's now closed.
      if (event.newState === 'closed') {
        // If it closed AND our controlling prop `open` is still true,
        // it means the closure was initiated *natively* (like ESC).
        // We must call onClose() to sync the parent's state.
        if (open) {
          onClose();
        }
      }
    };

    popover.addEventListener('toggle', handleNativeToggle);

    // Cleanup listener when the component unmounts or popoverRef changes
    return () => {
      popover.removeEventListener('toggle', handleNativeToggle);
    };
  });

  // --- Functions ---
  // Function to request closing the popover (used by button and backdrop)
  function requestClose() {
    // Call the provided callback; the parent component is responsible
    // for actually changing the `open` prop to false, which triggers
    // the $effect above to call `hidePopover()`.
    onClose();
  }
</script>

<!-- 
  Although popover has a ::backdrop, we use a custom one here 
  to easily apply Svelte transitions exactly like the original dialog.
  The custom backdrop also handles the "light dismiss" click.
-->
{#if open}
  <div
    class="custom-backdrop"
    onclick={requestClose}
    aria-hidden="true"
    in:fade={{ easing: quadOut, duration: 250 }}
    out:fade={{ easing: quadOut, duration: 250, delay: 100 }}>
  </div>
{/if}

<div
  bind:this={popoverRef}
  popover="auto"
  id={popoverId}
  class="popover-container">
  {#if open}
    <div
      class="popover-body"
      in:scale={{ easing: quadOut, duration: 400, delay: 100, start: 0.9 }}
      out:scale={{ easing: quadOut, duration: 400, start: 0.9 }}>
      <div class="popover-content">
        <button
          class="close-button"
          onclick={requestClose}
          aria-label="Close popover">
          &times;
        </button>

        {@render children()}
      </div>
    </div>
  {/if}
</div>

<style>
  .custom-backdrop {
    position: absolute;
    inset: 0;
    background-color: var(--color-background); /* Or your backdrop color */
    opacity: 0.9;
    backdrop-filter: blur(10px);
    z-index: 10; /* Below the popover */
  }

  /* The popover container itself */
  .popover-container {
    /* Reset browser defaults */
    padding: 0;
    border: none;
    background: none; /* Popover content has background */
    overflow: visible; /* Allow scaled content to show */

    /* Positioning and Sizing (similar to dialog) */
    position: absolute;
    inset: 0;
    z-index: 20; /* Above the backdrop */
    margin: auto; /* Center horizontally and vertically */
    width: fit-content; /* Size based on content */
    height: fit-content;
    max-width: calc(100% - 4em);
    max-height: calc(100% - 4em);

    /* Use :popover-open pseudo-class */
    & :popover-open {
      opacity: 1;
      transform: scale(1);
      /* Note: Direct transitions on the popover element itself can be tricky
         with show/hidePopover. Applying transitions to inner content is safer. */
    }
  }

  /* Hide the native ::backdrop if you don't want it interfering */
  .popover-container::backdrop {
    display: none;
  }

  .popover-body {
    background: var(--color-background-light);
    color: var(--color-text);
    border-radius: 8px;
    box-shadow: hsla(0, 0%, 0%, 0.2) 0 2px 2px;
    max-width: 100%; /* Ensure body respects container max-width */
    max-height: 100%; /* Ensure body respects container max-height */
    overflow: auto; /* Allow scrolling *within* the body if content exceeds size */
  }

  .popover-content {
    padding: 1.5em;
    position: relative;
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

  /* Ensure popover is not displayed when closed */
  /* This might be redundant with show/hidePopover, but good practice */
  .popover-container:not(:popover-open) {
    display: none;
  }
</style>
