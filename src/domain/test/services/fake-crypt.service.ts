import type { CryptService } from "../../user/services/crypt.service";

export class FakeCryptService implements CryptService {
  async hash(plain: string): Promise<string> {
    return plain;
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return plain === hashed;
  }
}
