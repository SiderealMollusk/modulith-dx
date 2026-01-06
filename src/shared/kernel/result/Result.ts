export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  public readonly isSuccess = true;
  public readonly isFailure = false;

  constructor(public readonly value: T) {}

  public map<U>(fn: (value: T) => U): Result<U, never> {
    return new Success(fn(this.value));
  }

  public flatMap<U, F>(fn: (value: T) => Result<U, F>): Result<U, F> {
    return fn(this.value);
  }

  public mapError<F>(_fn: (error: never) => F): Result<T, F> {
    return this as unknown as Result<T, F>;
  }

  public fold<U>(onSuccess: (value: T) => U, _onFailure: (error: never) => U): U {
    return onSuccess(this.value);
  }

  public getOrThrow(): T {
    return this.value;
  }

  public getOrElse(_defaultValue: T): T {
    return this.value;
  }
}

export class Failure<E> {
  public readonly isSuccess = false;
  public readonly isFailure = true;

  constructor(public readonly error: E) {}

  public map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  public flatMap<U, F>(_fn: (value: never) => Result<U, F>): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  public mapError<F>(fn: (error: E) => F): Result<never, F> {
    return new Failure(fn(this.error));
  }

  public fold<U>(_onSuccess: (value: never) => U, onFailure: (error: E) => U): U {
    return onFailure(this.error);
  }

  public getOrThrow(): never {
    throw this.error;
  }

  public getOrElse<T>(defaultValue: T): T {
    return defaultValue;
  }
}

export const success = <T>(value: T): Success<T> => new Success(value);
export const failure = <E>(error: E): Failure<E> => new Failure(error);
