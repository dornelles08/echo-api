export interface TagPresenterResponse {
  tags: string[];
}

export namespace TagPresenter {
  export function toHTTP(tags: string[]): TagPresenterResponse {
    return {
      tags,
    };
  }
}
