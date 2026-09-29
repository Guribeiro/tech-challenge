import { Token } from "@/modules/os-orcamento/domain/entities/token.js"
import { TokenRepository } from "../../domain/repositories/token-repository.js"

export class InMemoryTokenRepository implements TokenRepository {
  public items: Token[] = []

  async create(token: Token): Promise<void> {
    this.items.push(token)
  }

  async save(token: Token): Promise<void> {
    const index = this.items.findIndex(t => t.getId() === token.getId())
    if (index !== -1) {
      this.items[index] = token
    }
  }

  async findByToken(token: string): Promise<Token | null> {
    return this.items.find(t => t.getToken() === token) || null
  }
}
