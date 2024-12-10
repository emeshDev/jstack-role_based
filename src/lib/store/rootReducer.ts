// src/lib/store/rootReducer.ts
import { createAction } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";
import { api } from "./api";

export const resetState = createAction("RESET_STATE");

const appReducer = combineReducers({
  [api.reducerPath]: api.reducer,
});

export const rootReducer = (
  state: ReturnType<typeof appReducer> | undefined,
  action: any
) => {
  if (action.type === resetState.type) {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};
