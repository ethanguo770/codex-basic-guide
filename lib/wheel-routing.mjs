export const WHEEL_GESTURE_THRESHOLD = 72;
export const WHEEL_GESTURE_RELEASE_MS = 220;

export function normalizeWheelDelta(deltaY, deltaMode, viewportHeight) {
  if (deltaMode === 1) return deltaY * 16;
  if (deltaMode === 2) return deltaY * viewportHeight;
  return deltaY;
}

export function canLessonScroll({ overflowY, scrollTop, scrollHeight, clientHeight }, delta) {
  if (overflowY !== "auto" && overflowY !== "scroll") return false;
  if (scrollHeight <= clientHeight + 1 || delta === 0) return false;
  if (delta > 0) return scrollTop + clientHeight < scrollHeight - 1;
  return scrollTop > 1;
}

export function routeWheelInput({ delta, gestureActive, accumulator, lesson }) {
  if (lesson && canLessonScroll(lesson, delta)) {
    return { action: "scroll", gestureActive: true, accumulator: 0 };
  }

  const nextAccumulator = accumulator + delta;
  if (gestureActive || Math.abs(nextAccumulator) < WHEEL_GESTURE_THRESHOLD) {
    return { action: "wait", gestureActive, accumulator: nextAccumulator };
  }

  return {
    action: nextAccumulator > 0 ? "advance-next" : "advance-previous",
    gestureActive: true,
    accumulator: 0,
  };
}
