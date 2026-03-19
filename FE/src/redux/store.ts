import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import companyReducer from './slices/companySlice'; // Import the new reducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    company: companyReducer, // Add the company reducer
  },
  // DevTools are automatically enabled in development
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;