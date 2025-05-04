"use strict";
// Options-style monad to wrap TypeScript type checks
Object.defineProperty(exports, "__esModule", { value: true });
exports.Options = void 0;
class Ok {
    constructor(value) {
        this.value = value;
    }
    isOk() {
        return true;
    }
    isErr() {
        return false;
    }
    map(fn) {
        return new Ok(fn(this.value));
    }
    orElse(_) {
        return this;
    }
    unwrap() {
        return this.value;
    }
}
class Err {
    constructor(error) {
        this.error = error;
    }
    isOk() {
        return false;
    }
    isErr() {
        return true;
    }
    map(_) {
        return new Err(this.error);
    }
    orElse(fn) {
        return new Ok(fn(this.error));
    }
    unwrap() {
        throw this.error;
    }
}
// Helper object for functional use
exports.Options = {
    Ok: (value) => new Ok(value),
    Err: (error) => new Err(error),
    fromNullable: (value, error) => value != null ? new Ok(value) : new Err(error),
};
//# sourceMappingURL=options.js.map