import {BehaviorSubject, Observable, combineLatest} from 'rxjs';
import {distinctUntilChanged, map, take, publishBehavior} from 'rxjs/operators';
import {produce, Draft} from 'immer';
import {memoize} from './memoize';

export class Store<T> {
  private readonly state: BehaviorSubject<T>;

  constructor(initialValue: T) {
    this.state = new BehaviorSubject<T>(initialValue);
  }

  set(fnOrState: UpdateFn<T> | T) {
    if (isUpdateFn(fnOrState)) {
      // Wrap the updater to never return a value. We explicitly do not support
      // immer's ability to have update functions return a new object.
      const wrappedUpdater = (draft: Draft<T>) => {
        fnOrState(draft);
      };
      const newState = produce(this.snapshot(), wrappedUpdater);
      this.state.next(newState);
    } else {
      this.state.next(fnOrState);
    }
  }

  snapshot(): T {
    return this.state.getValue();
  }

  select(): Observable<T> {
    return this.state.asObservable().pipe(distinctUntilChanged());
  }
}

export interface UpdateFn<T> {
  (draftState: Draft<T>): void;
}

export interface Selector<A, B> {
  (a: A): B;
}

export class StoreValue<T> {
  constructor(private readonly state: BehaviorSubject<T>) {}

  snapshot(): T {
    return this.state.getValue();
  }

  select(): Observable<T> {
    return this.state.asObservable();
  }

  map<R>(selector: Selector<T, R>): StoreValue<R> {
    return create(this, selector);
  }

  join<B, R>(b: Joinable<B>, projector: (a: T, b: B) => R): StoreValue<R>;

  join<B, C, R>(
    b: Joinable<B>,
    c: Joinable<C>,
    projector: (a: T, b: B, c: C) => R
  ): StoreValue<R>;

  join<B, C, D, R>(
    b: Joinable<B>,
    c: Joinable<C>,
    d: Joinable<D>,
    projector: (a: T, b: B, c: C, d: D) => R
  ): StoreValue<R>;

  join(...inputs: (Joinable<{}> | AnyFn)[]): StoreValue<{}> {
    return createFromList(inputs);
  }
}

function isUpdateFn<T>(fnOrState: UpdateFn<T> | T): fnOrState is UpdateFn<T> {
  return fnOrState instanceof Function;
}

export interface Joinable<T> {
  snapshot(): T;
  select(): Observable<T>;
}

export function create<A, R>(
  a: Joinable<A>,
  projector: (a: A) => R
): StoreValue<R>;

export function create<A, B, R>(
  a: Joinable<A>,
  b: Joinable<B>,
  projector: (a: A, b: B) => R
): StoreValue<R>;

export function create<A, B, C, R>(
  a: Joinable<A>,
  b: Joinable<B>,
  c: Joinable<C>,
  projector: (a: A, b: B, c: C) => R
): StoreValue<R>;

export function create<A, B, C, D, R>(
  a: Joinable<A>,
  b: Joinable<B>,
  c: Joinable<C>,
  d: Joinable<D>,
  projector: (a: A, b: B, c: C, d: D) => R
): StoreValue<R>;

export function create(...inputs: (Joinable<{}> | AnyFn)[]): StoreValue<{}> {
  return createFromList(inputs);
}

function createFromList(inputs: (Joinable<{}> | AnyFn)[]): StoreValue<{}> {
  const projector = inputs.pop() as AnyFn;
  const joinables = inputs as Joinable<{}>[];
  const joinablesAsObservables = joinables.map(i => i.select());
  const behavior = joinInputs(joinablesAsObservables, projector);
  return new StoreValue<{}>(behavior);
}

function joinInputs(
  inputs: Observable<{}>[],
  projector: AnyFn
): BehaviorSubject<{}> {
  const memoizedProjector = memoize(projector);

  const combined = combineLatest([...inputs]);
  const transformed = combined.pipe(
    map(args => {
      return memoizedProjector.apply(null, args);
    }),
    distinctUntilChanged()
  );

  const initial = transformed.pipe(take(1));
  const behavior = new BehaviorSubject<{}>(initial);
  transformed.subscribe(behavior);

  return behavior;
}

type AnyFn = (...args: any[]) => any;
