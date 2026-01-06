export interface Query {
  readonly queryId: string;
  readonly queryType: string;
}

export interface QueryHandler<T extends Query = Query, R = unknown> {
  handle(query: T): Promise<R>;
}

export interface QueryBus {
  execute<T extends Query, R>(query: T): Promise<R>;
  register<T extends Query, R>(queryType: string, handler: QueryHandler<T, R>): void;
}

export class InMemoryQueryBus implements QueryBus {
  private readonly handlers = new Map<string, QueryHandler>();

  public async execute<T extends Query, R>(query: T): Promise<R> {
    const handler = this.handlers.get(query.queryType);
    if (!handler) {
      throw new Error(`No handler registered for query: ${query.queryType}`);
    }
    return handler.handle(query) as Promise<R>;
  }

  public register<T extends Query, R>(
    queryType: string,
    handler: QueryHandler<T, R>,
  ): void {
    if (this.handlers.has(queryType)) {
      throw new Error(`Handler already registered for query: ${queryType}`);
    }
    this.handlers.set(queryType, handler as QueryHandler);
  }
}
