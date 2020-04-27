// https://github.com/pelotom/use-methods
import produce, { applyPatches } from "immer";
import { useMemo, useEffect, useRef, useReducer, useCallback } from "react";
import isEqualWith from "lodash.isequalwith";
import { History } from "./History";
import { Delete } from "./utilityTypes";

export type SubscriberAndCallbacksFor<
  M extends MethodsOrOptions,
  Q extends QueryMethods = any
> = {
  subscribe: Watcher<StateFor<M>>["subscribe"];
  getState: () => { prev: StateFor<M>; current: StateFor<M> };
  actions: CallbacksFor<M>;
  query: QueryCallbacksFor<Q>;
  history: History;
};

export type StateFor<M extends MethodsOrOptions> = M extends MethodsOrOptions<
  infer S,
  any
>
  ? S
  : never;

export type CallbacksFor<
  M extends MethodsOrOptions
> = M extends MethodsOrOptions<any, infer R>
  ? {
      [T in ActionUnion<R>["type"]]: (
        ...payload: ActionByType<ActionUnion<R>, T>["payload"]
      ) => void;
    } & {
      undo: () => void;
      redo: () => void;
      runWithoutHistory: Delete<
        {
          [T in ActionUnion<R>["type"]]: (
            ...payload: ActionByType<ActionUnion<R>, T>["payload"]
          ) => void;
        },
        M extends Options ? M["ignoreHistoryForActions"][number] : never
      >;
    }
  : never;

export type Methods<S = any, R extends MethodRecordBase<S> = any, Q = any> = (
  state: S,
  query: Q
) => R;

export type Options<S = any, R extends MethodRecordBase<S> = any, Q = any> = {
  methods: Methods<S, R, Q>;
  ignoreHistoryForActions: ReadonlyArray<keyof MethodRecordBase>;
};

export type MethodsOrOptions<
  S = any,
  R extends MethodRecordBase<S> = any,
  Q = any
> = Methods<S, R, Q> | Options<S, R, Q>;

export type MethodRecordBase<S = any> = Record<
  string,
  (...args: any[]) => S extends object ? S | void : S
>;

export type ActionUnion<R extends MethodRecordBase> = {
  [T in keyof R]: { type: T; payload: Parameters<R[T]> };
}[keyof R];

export type ActionByType<A, T> = A extends { type: infer T2 }
  ? T extends T2
    ? A
    : never
  : never;

export type QueryMethods<
  S = any,
  O = any,
  R extends MethodRecordBase<S> = any
> = (state?: S, options?: O) => R;
export type QueryCallbacksFor<M extends QueryMethods> = M extends QueryMethods<
  any,
  any,
  infer R
>
  ? {
      [T in ActionUnion<R>["type"]]: (
        ...payload: ActionByType<ActionUnion<R>, T>["payload"]
      ) => ReturnType<R[T]>;
    } & { canUndo: () => boolean; canRedo: () => boolean }
  : never;

export function useMethods<S, R extends MethodRecordBase<S>>(
  methodsOrOptions: Methods<S, R>,
  initialState: any
): SubscriberAndCallbacksFor<MethodsOrOptions<S, R>>;

export function useMethods<
  S,
  R extends MethodRecordBase<S>,
  Q extends QueryMethods
>(
  methodsOrOptions: MethodsOrOptions<S, R, QueryCallbacksFor<Q>>, // methods to manipulate the state
  initialState: any,
  queryMethods: Q
): SubscriberAndCallbacksFor<MethodsOrOptions<S, R>, Q>;

export function useMethods<
  S,
  R extends MethodRecordBase<S>,
  Q extends QueryMethods = null
>(
  methodsOrOptions: MethodsOrOptions<S, R>,
  initialState: any,
  queryMethods?: Q
): SubscriberAndCallbacksFor<MethodsOrOptions<S, R>, Q> {
  const history = useMemo(() => new History(), []);

  let methods: Methods<S, R>;
  let ignoreHistoryForActions = [];

  if (typeof methodsOrOptions === "function") {
    methods = methodsOrOptions;
  } else {
    methods = methodsOrOptions.methods;
    ignoreHistoryForActions = methodsOrOptions.ignoreHistoryForActions as any;
  }

  const [reducer, methodsFactory] = useMemo(() => {
    return [
      (state: S, action: ActionUnion<R>) => {
        const query =
          queryMethods && createQuery(queryMethods, () => state, history);

        return (produce as any)(
          state,
          (draft: S) => {
            switch (action.type) {
              case "undo": {
                if (history.canUndo()) {
                  return history.undo(state);
                }
                break;
              }
              case "redo": {
                if (history.canRedo()) {
                  return history.redo(state);
                }
                break;
              }

              case "runWithoutHistory": {
                const [type, ...params] = action.payload;
                methods(draft, query)[type](...params);
                break;
              }
              default:
                methods(draft, query)[action.type](...action.payload);
            }
          },
          (patches, inversePatches) => {
            if (
              [
                ...ignoreHistoryForActions,
                "undo",
                "redo",
                "runWithoutHistory",
              ].includes(action.type as any)
            ) {
              return;
            }

            applyPatches(state, patches);
            history.add(patches, inversePatches);
          }
        );
      },
      methods,
    ];
  }, []);

  const [state, dispatch] = useReducer(reducer, initialState);

  // Create ref for state, so we can use it inside memoized functions without having to add it as a dependency
  const currState = useRef();
  currState.current = state;

  const query = useMemo(
    () =>
      !queryMethods
        ? []
        : createQuery(queryMethods, () => currState.current, history),
    [queryMethods]
  );

  const actions = useMemo(() => {
    const standardMethodsNames = Object.keys(methodsFactory(null, null));
    const actionTypes: ActionUnion<R>["type"][] = [
      ...standardMethodsNames,
      "undo",
      "redo",
    ];

    return {
      ...actionTypes.reduce((accum, type) => {
        accum[type] = (...payload) =>
          dispatch({ type, payload } as ActionUnion<R>);
        return accum;
      }, {} as any),
      runWithoutHistory: {
        ...standardMethodsNames
          .filter((type) => !ignoreHistoryForActions.includes(type))
          .reduce((accum, type) => {
            accum[type] = (...payload) =>
              dispatch({
                type: "runWithoutHistory",
                payload: [type, ...payload],
              } as ActionUnion<R>);
            return accum;
          }, {} as any),
      },
    };
  }, [methodsFactory]);

  const getState = useCallback(() => currState.current, []);
  const watcher = useMemo(() => new Watcher<S>(getState), [getState]);

  useEffect(() => {
    currState.current = state;
    watcher.notify();
  }, [state, watcher]);

  return useMemo(
    () => ({
      getState,
      subscribe: (collector, cb, collectOnCreate) =>
        watcher.subscribe(collector, cb, collectOnCreate),
      actions,
      query,
      history,
    }),
    [actions, query, watcher, getState, history]
  ) as any;
}

export function createQuery<Q extends QueryMethods>(
  queryMethods: Q,
  getState,
  history: History
) {
  const queries = Object.keys(queryMethods()).reduce((accum, key) => {
    return {
      ...accum,
      [key]: (...args: any) => {
        return queryMethods(getState())[key](...args);
      },
    };
  }, {} as QueryCallbacksFor<typeof queryMethods>);

  return {
    ...queries,
    canUndo: () => history.canUndo(),
    canRedo: () => history.canRedo(),
  };
}

class Watcher<S> {
  getState;
  subscribers: Subscriber[] = [];

  constructor(getState) {
    this.getState = getState;
  }

  /**
   * Creates a Subscriber
   * @returns {() => void} a Function that removes the Subscriber
   */
  subscribe<C>(
    collector: (state: S) => C,
    onChange: (collected: C) => void,
    collectOnCreate?: boolean
  ): () => void {
    const subscriber = new Subscriber(
      () => collector(this.getState()),
      onChange,
      collectOnCreate
    );
    this.subscribers.push(subscriber);
    return this.unsubscribe.bind(this, subscriber);
  }

  unsubscribe(subscriber) {
    if (this.subscribers.length) {
      const index = this.subscribers.indexOf(subscriber);
      if (index > -1) return this.subscribers.splice(index, 1);
    }
  }

  notify() {
    // Give unsubscribing the priority. Any better way?
    setTimeout(() => {
      for (let i = 0; i < this.subscribers.length; i++) {
        this.subscribers[i].collect();
      }
    });
  }
}

class Subscriber {
  collected: any;
  collector: () => any;
  onChange: (collected: any) => void;
  id;

  /**
   * Creates a Subscriber
   * @param collector The method that returns an object of values to be collected
   * @param onChange A callback method that is triggered when the collected values has changed
   * @param collectOnCreate If set to true, the collector/onChange will be called on instantiation
   */
  constructor(collector, onChange, collectOnCreate = false) {
    this.collector = collector;
    this.onChange = onChange;

    // Collect and run onChange callback when Subscriber is created
    if (collectOnCreate) this.collect();
  }

  collect() {
    try {
      const recollect = this.collector();
      if (!isEqualWith(recollect, this.collected)) {
        this.collected = recollect;
        if (this.onChange) this.onChange(this.collected);
      }
    } catch (err) {
      console.warn(err);
    }
  }
}
