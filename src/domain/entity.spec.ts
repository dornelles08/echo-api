import { describe, expect, it } from "vitest";

import { Entity } from "./entity";

class TestEntity extends Entity<{ value: string }> {
  static create(value: string, id?: string) {
    return new TestEntity({ value }, id);
  }

  get value() {
    return this.props.value;
  }
}

describe("Entity", () => {
  it("generates a random uuid id by default", () => {
    const entity = TestEntity.create("a");

    expect(entity.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("uses the provided id when given", () => {
    const entity = TestEntity.create("a", "custom-id");

    expect(entity.id).toBe("custom-id");
  });

  it("generates unique ids across instances", () => {
    const ids = new Set(Array.from({ length: 100 }, () => TestEntity.create("a").id));

    expect(ids.size).toBe(100);
  });

  it("updateId replaces the entity id", () => {
    const entity = TestEntity.create("a");
    entity.updateId("updated-id");

    expect(entity.id).toBe("updated-id");
  });
});
