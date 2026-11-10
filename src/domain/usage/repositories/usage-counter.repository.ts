import type { UsageCounter } from "../entities/UsageCounter";

export interface UsageCounterRepository {
  getOrCreate(userId: string): Promise<UsageCounter>;
  increment(id: string, minutes: number): Promise<void>;
  findByUserId(userId: string): Promise<UsageCounter | null>;
  /**
   * Reserva minutos de forma atômica (check + increment em uma transação com
   * SELECT FOR UPDATE). Retorna true se houve minutos suficientes, false caso
   * contrário.
   */
  reserveMinutes(userId: string, minutes: number): Promise<boolean>;
  /**
   * Devolve minutos ao counter do usuário (reembolso). Não decrementa abaixo de zero.
   */
  decrement(userId: string, minutes: number): Promise<void>;
}
