"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type SessionState = {
  csrfToken: string | null;
};

const initialState: SessionState = {
  csrfToken: null
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setCsrfToken(state, action: PayloadAction<string | null>) {
      state.csrfToken = action.payload;
    }
  }
});

export const { setCsrfToken } = sessionSlice.actions;

export default sessionSlice.reducer;
