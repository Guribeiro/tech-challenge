export interface EventHandler {
  /**
   * Este método deve conter a lógica para registrar o subscriber
   * dentro do gerenciador central de eventos (DomainEvents).
   */
  setupSubscriptions(): void
}