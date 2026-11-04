import { Entity } from "../../entity";

export interface FileProps {
  name: string;
  url: string;
  key: string;
}

export class File extends Entity<FileProps> {
  get name() {
    return this.props.name;
  }

  get url() {
    return this.props.url;
  }

  get key() {
    return this.props.key;
  }

  static create(props: FileProps, id?: string) {
    const file = new File(props, id);
    return file;
  }
}
