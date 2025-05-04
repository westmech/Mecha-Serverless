// Options-style monad to wrap TypeScript type checks

export type Options<T, E> = Ok<T, E> | Err<T, E>;

class Ok<T, E> {
  readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  isOk(): this is Ok<T, E> {
    return true;
  }

  isErr(): this is Err<T, E> {
    return false;
  }

  map<U>(fn: (value: T) => U): Options<U, E> {
    return new Ok<U, E>(fn(this.value));
  }

  orElse(_: (error: E) => T): Options<T, E> {
    return this;
  }

  unwrap(): T {
    return this.value;
  }
}

class Err<T, E> {
  readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  isOk(): this is Ok<T, E> {
    return false;
  }

  isErr(): this is Err<T, E> {
    return true;
  }

  map<U>(_: (value: T) => U): Options<U, E> {
    return new Err<U, E>(this.error);
  }

  orElse(fn: (error: E) => T): Options<T, E> {
    return new Ok<T, E>(fn(this.error));
  }

  unwrap(): T {
    throw this.error;
  }
}

// Helper object for functional use
export const Options = {
  Ok: <T, E = never>(value: T): Options<T, E> => new Ok(value),
  Err: <T = never, E = unknown>(error: E): Options<T, E> => new Err<T, E>(error),
  fromNullable: <T, E>(value: T | null | undefined, error: E): Options<T, E> =>
    value != null ? new Ok(value) : new Err(error),
};
