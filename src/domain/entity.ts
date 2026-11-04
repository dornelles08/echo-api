import { randomUUID } from "node:crypto";

export class Entity<T> {
  protected _id: string;
  public props: T;

  get id() {
    return this._id;
  }

  protected constructor(props: T, id?: string) {
    this.props = props;
    this._id = id ?? randomUUID();
  }

  /**
   * Updates the entity ID after creation.
   * This is needed when the database generates its own ID (e.g., MongoDB ObjectId)
   * and we need to update the entity with the real ID from the database.
   */
  updateId(id: string): void {
    this._id = id;
  }
}
