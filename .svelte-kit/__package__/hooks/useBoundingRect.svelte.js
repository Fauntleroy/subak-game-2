import { onMount } from 'svelte';
export function useBoundingRect() {
    var ref = $state(null);
    var rect = $state(null);
    var update = function () {
        if (!ref)
            return;
        rect = ref.getBoundingClientRect();
    };
    onMount(function () {
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update);
        update();
    });
    // so... when ref changes, fire
    $effect(function () {
        update();
    });
    return {
        get ref() {
            return ref;
        },
        get rect() {
            return rect;
        },
        set ref(el) {
            ref = el;
        },
        update: update
    };
}
