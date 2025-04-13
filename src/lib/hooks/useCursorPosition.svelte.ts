/**
 * Tracks the mouse cursor's position relative to a target HTML element,
 * optimizing by caching the element's bounding rectangle.
 *
 * @returns A tuple containing:
 *   - A $state variable to bind to the target element (`bind:this`).
 *   - A $state store containing the cursor's relative { x, y } coordinates
 *     (or { x: null, y: null } if the element isn't set or the mouse
 *     hasn't entered it).
 */
export function useCursorPosition(): {
  ref: HTMLElement | null;
  x: number;
  y: number;
} {
  let ref = $state<HTMLElement | null>(null);
  let x = $state<number>(0);
  let y = $state<number>(0);

  // Cache the element's bounding rectangle
  let cachedRect: DOMRect | null = $state(null);

  // Effect to manage all listeners and update cache
  $effect(() => {
    const element = ref; // Capture current value

    if (!element) {
      // Reset position and cache if element is removed or not yet set
      x = 0;
      y = 0;
      cachedRect = null;
      return; // No element, nothing to listen to
    }

    // --- Function to update the cached rectangle ---
    const updateRect = () => {
      cachedRect = element.getBoundingClientRect();
      // console.log("Updated Rect Cache:", cachedRect); // For debugging
    };

    // --- Initial cache update ---
    updateRect();

    // --- Mouse Move Handler (uses cached rect) ---
    const handleMouseMove = (event: MouseEvent) => {
      if (!cachedRect) {
        // Should ideally not happen if element exists, but safety check
        updateRect(); // Update if somehow null
        if (!cachedRect) return; // Still null? Bail.
      }

      // Calculate position relative to the element's cached top-left corner
      x = event.clientX - cachedRect.left;
      y = event.clientY - cachedRect.top;
    };

    // --- Mouse Leave Handler ---
    // const handleMouseLeave = () => {
    //   cursorPosition.x = null;
    //   cursorPosition.y = null;
    // };

    // --- Add Listeners ---
    element.addEventListener('mousemove', handleMouseMove);
    // element.addEventListener('mouseleave', handleMouseLeave);
    // Listen to window scroll and resize to update the cached rect
    // Use { passive: true } for scroll/resize for better performance
    window.addEventListener('scroll', updateRect, { passive: true });
    window.addEventListener('resize', updateRect, { passive: true });

    // --- Cleanup Function ---
    return () => {
      // console.log("Cleaning up listeners for:", element); // For debugging
      element.removeEventListener('mousemove', handleMouseMove);
      // element.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
      // Reset cache on cleanup as well
      cachedRect = null;
    };
  }); // Dependencies: ref

  return {
    get ref() {
      return ref;
    },
    get x() {
      return x;
    },
    get y() {
      return y;
    },
    set ref(el) {
      ref = el;
    }
  };
}
