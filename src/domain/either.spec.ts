import { describe, expect, it } from "vitest";

import { Left, Left as LeftClass, left, Right, right } from "./either";

describe("Either", () => {
  it("left wraps a value as an isLeft Either", () => {
    const result = left<string, number>("error");

    expect(result.isLeft()).toBe(true);
    expect(result.isRight()).toBe(false);
    expect(result.value).toBe("error");
  });

  it("right wraps a value as an isRight Either", () => {
    const result = right<string, number>(42);

    expect(result.isRight()).toBe(true);
    expect(result.isLeft()).toBe(false);
    expect(result.value).toBe(42);
  });

  it("exposes Left and Right classes with correct type guards", () => {
    expect(new Left("boom").isLeft()).toBe(true);
    expect(new Left("boom").isRight()).toBe(false);
    expect(new Right(1).isRight()).toBe(true);
    expect(new Right(1).isLeft()).toBe(false);
    expect(LeftClass).toBe(Left);
  });

  it("helpers return instances of Left and Right", () => {
    expect(left("x")).toBeInstanceOf(Left);
    expect(right<string, number>(1)).toBeInstanceOf(Right);
  });

  it("narrows the union type through isLeft/isRight", () => {
    const result = right<string, number>(7);

    if (result.isRight()) {
      expect(result.value).toBe(7);
    } else {
      throw new Error("expected right");
    }
  });
});
