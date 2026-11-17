import { Entity } from "../../entity";

export interface UploadProps {
  userId: string;
  storageKey: string;
  filename: string;
  type: "audio" | "video";
  durationSeconds: number;
  consumedAt?: Date;
  createdAt?: Date;
}

export class Upload extends Entity<UploadProps> {
  get userId() {
    return this.props.userId;
  }

  get storageKey() {
    return this.props.storageKey;
  }

  get filename() {
    return this.props.filename;
  }

  get type() {
    return this.props.type;
  }

  get durationSeconds() {
    return this.props.durationSeconds;
  }

  get consumedAt() {
    return this.props.consumedAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  static create(props: UploadProps, id?: string) {
    const upload = new Upload(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
    return upload;
  }
}
