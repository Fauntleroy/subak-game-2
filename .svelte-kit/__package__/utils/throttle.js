/**
 * Creates a throttled function that only invokes func at most once per
 * every wait milliseconds. The throttled function comes with a `cancel`
 * method to cancel delayed func invocations and a `flush` method to
 * immediately invoke func. Provide options to indicate whether func
 * should be invoked on the leading and/or trailing edge of the wait timeout.
 * The func is invoked with the last arguments provided to the throttled
 * function. Subsequent calls to the throttled function return the result of
 * the last func invocation.
 *
 * Note: This is a simplified version focusing on leading edge execution,
 * suitable for the game loop scenario. More complex versions might handle
 * trailing edge calls as well.
 *
 * @param {Function} func The function to throttle.
 * @param {number} waitMs The number of milliseconds to throttle invocations to.
 * @returns {Function} Returns the new throttled function.
 */
export function throttle(func, waitMs) {
    var lastExecutionTime = 0;
    var lastResult;
    // The returned throttled function
    return function throttled() {
        var args = []; // Capture arguments
        for (var _i = 0 // Capture arguments
        ; _i < arguments.length // Capture arguments
        ; _i++ // Capture arguments
        ) {
            args[_i] = arguments[_i]; // Capture arguments
        }
        var currentTime = performance.now();
        // Check if enough time has passed since the last execution
        if (currentTime - lastExecutionTime >= waitMs) {
            lastExecutionTime = currentTime; // Record the time of this execution
            // Execute the original function with the correct 'this' context and arguments
            lastResult = func.apply(this, args);
            return lastResult;
        }
        // If throttled, return the last known result (or undefined if never run)
        return lastResult;
    };
}
