import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeWheelDelta,
  routeWheelInput,
  WHEEL_GESTURE_RELEASE_MS,
  WHEEL_GESTURE_THRESHOLD,
} from "../lib/wheel-routing.mjs";

const scrollableLesson = (overrides = {}) => ({
  overflowY: "auto",
  scrollTop: 100,
  scrollHeight: 900,
  clientHeight: 500,
  ...overrides,
});

test("normalizes pixel, line, and page wheel deltas", () => {
  assert.equal(normalizeWheelDelta(12, 0, 720), 12);
  assert.equal(normalizeWheelDelta(3, 1, 720), 48);
  assert.equal(normalizeWheelDelta(1, 2, 720), 720);
});

test("lets a narrow lesson scroll without advancing the tutorial", () => {
  assert.deepEqual(routeWheelInput({
    delta: 100,
    gestureActive: false,
    accumulator: 0,
    lesson: scrollableLesson(),
  }), { action: "scroll", gestureActive: true, accumulator: 0 });

  assert.deepEqual(routeWheelInput({
    delta: -100,
    gestureActive: false,
    accumulator: 0,
    lesson: scrollableLesson(),
  }), { action: "scroll", gestureActive: true, accumulator: 0 });
});

test("advances only on a new gesture at the lesson boundary", () => {
  const atBottom = scrollableLesson({ scrollTop: 400 });
  assert.deepEqual(routeWheelInput({ delta: 100, gestureActive: true, accumulator: 0, lesson: atBottom }), {
    action: "wait",
    gestureActive: true,
    accumulator: 100,
  });
  assert.deepEqual(routeWheelInput({ delta: 100, gestureActive: false, accumulator: 0, lesson: atBottom }), {
    action: "advance-next",
    gestureActive: true,
    accumulator: 0,
  });

  const atTop = scrollableLesson({ scrollTop: 0 });
  assert.equal(routeWheelInput({ delta: -100, gestureActive: false, accumulator: 0, lesson: atTop }).action, "advance-previous");
});

test("trackpad inertia cannot trigger more than one tutorial step", () => {
  const first = routeWheelInput({ delta: WHEEL_GESTURE_THRESHOLD, gestureActive: false, accumulator: 0, lesson: null });
  assert.equal(first.action, "advance-next");

  const inertia = routeWheelInput({ delta: 300, gestureActive: first.gestureActive, accumulator: first.accumulator, lesson: null });
  assert.equal(inertia.action, "wait");
  assert.equal(WHEEL_GESTURE_RELEASE_MS, 220);
});
