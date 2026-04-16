"use client";

import { useLayoutEffect } from "react";

/**
 * Reusable hook to lock body scroll when a component (like a modal) is mounted.
 * Prevents background scrolling and layout shifts.
 * 
 * @param lock - boolean to determine if scroll should be locked
 */
// Track how many consumers currently want the scroll locked
let lockCount = 0;
let originalOverflow = "";

export function useLockBodyScroll(lock: boolean = true) {
    useLayoutEffect(() => {
        if (!lock) return;

        // First lock: save original overflow and apply hidden
        if (lockCount === 0) {
            originalOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
        }
        lockCount++;

        return () => {
            lockCount--;
            // Last unlock: restore original overflow
            if (lockCount === 0) {
                document.body.style.overflow = originalOverflow;
            }
        };
    }, [lock]);
}
