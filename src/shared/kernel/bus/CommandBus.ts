export interface Command {
  readonly commandId: string;
  readonly commandType: string;
}

export interface CommandHandler<T extends Command = Command, R = void> {
  handle(command: T): Promise<R>;
}

export interface CommandBus {
  execute<T extends Command, R>(command: T): Promise<R>;
  register<T extends Command, R>(
    commandType: string,
    handler: CommandHandler<T, R>,
  ): void;
}

export class InMemoryCommandBus implements CommandBus {
  private readonly handlers = new Map<string, CommandHandler>();

  public async execute<T extends Command, R>(command: T): Promise<R> {
    const handler = this.handlers.get(command.commandType);
    if (!handler) {
      throw new Error(`No handler registered for command: ${command.commandType}`);
    }
    return handler.handle(command) as Promise<R>;
  }

  public register<T extends Command, R>(
    commandType: string,
    handler: CommandHandler<T, R>,
  ): void {
    if (this.handlers.has(commandType)) {
      throw new Error(`Handler already registered for command: ${commandType}`);
    }
    this.handlers.set(commandType, handler as CommandHandler);
  }
}
