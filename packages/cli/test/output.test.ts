import assert from "node:assert/strict";
import { bold, dim, green, red, yellow } from "../src/renderer.js";

function test(description: string, fn: () => void): void {
    fn();
    console.log(`ok: ${description}`);
}

test("dim wraps text with dim ANSI code and reset", () => {
    const result = dim("text");
    assert.ok(result.includes("\x1b[2m"), "should contain dim code");
    assert.ok(result.includes("\x1b[0m"), "should contain reset code");
    assert.ok(result.includes("text"), "should contain original text");
});

test("bold wraps text with bold ANSI code and reset", () => {
    const result = bold("text");
    assert.ok(result.includes("\x1b[1m"), "should contain bold code");
    assert.ok(result.includes("\x1b[0m"), "should contain reset code");
    assert.ok(result.includes("text"), "should contain original text");
});

test("green wraps text with green ANSI code and reset", () => {
    const result = green("text");
    assert.ok(result.includes("\x1b[32m"), "should contain green code");
    assert.ok(result.includes("\x1b[0m"), "should contain reset code");
    assert.ok(result.includes("text"), "should contain original text");
});

test("red wraps text with red ANSI code and reset", () => {
    const result = red("text");
    assert.ok(result.includes("\x1b[31m"), "should contain red code");
    assert.ok(result.includes("\x1b[0m"), "should contain reset code");
    assert.ok(result.includes("text"), "should contain original text");
});

test("yellow wraps text with yellow ANSI code and reset", () => {
    const result = yellow("text");
    assert.ok(result.includes("\x1b[33m"), "should contain yellow code");
    assert.ok(result.includes("\x1b[0m"), "should contain reset code");
    assert.ok(result.includes("text"), "should contain original text");
});

test("bold(green(text)) contains both bold and green codes", () => {
    const result = bold(green("text"));
    assert.ok(result.includes("\x1b[1m"), "should contain bold code");
    assert.ok(result.includes("\x1b[32m"), "should contain green code");
    assert.ok(result.includes("text"), "should contain original text");
});
