import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAdminUploads } from "../../api";

export const fetchUploads = createAsyncThunk(
  "adminUploads/fetchUploads",
  async ({ tabKey, type, page, limit, search }, { rejectWithValue }) => {
    try {
      const res = await getAdminUploads({ type, page, limit, search });
      return { tabKey, page, search, data: res.data };
    } catch (err) {
      return rejectWithValue({
        tabKey,
        error: err.response?.data || { message: err.message },
      });
    }
  },
  {
    condition: ({ tabKey, page, search, force }, { getState }) => {
      if (force) return true;
      const tab = getState().adminUploads.tabs[tabKey];
      if (!tab) return true;
      if (tab._loading) return false;
      if (tab._loaded && tab._page === page && (tab._search || "") === (search || "")) {
        return false;
      }
      return true;
    },
  }
);

const makeTab = () => ({
  _loading: false,
  _loaded: false,
  _error: null,
  _search: "",
  _page: 1,
  items: [],
  pagination: {},
});

const initialState = {
  tabs: {
    all: makeTab(),
    videos: makeTab(),
    shorts: makeTab(),
  },
  counts: {
    all: 0,
    videos: 0,
    shorts: 0,
  },
};

const adminUploadsSlice = createSlice({
  name: "adminUploads",
  initialState,
  reducers: {
    setSearch(state, { payload }) {
      const { type, search } = payload;
      if (state.tabs[type]) {
        state.tabs[type]._search = search;
      }
    },
    resetTab(state, { payload }) {
      const type = payload;
      if (state.tabs[type]) {
        state.tabs[type] = makeTab();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUploads.pending, (state, action) => {
        const { tabKey } = action.meta.arg;
        if (!state.tabs[tabKey]) state.tabs[tabKey] = makeTab();
        state.tabs[tabKey]._loading = true;
        state.tabs[tabKey]._error = null;
      })
      .addCase(fetchUploads.fulfilled, (state, action) => {
        const { tabKey, page, search } = action.meta.arg;
        const { data } = action.payload;
        if (!state.tabs[tabKey]) state.tabs[tabKey] = makeTab();
        state.tabs[tabKey]._loading = false;
        state.tabs[tabKey]._loaded = true;
        state.tabs[tabKey]._error = null;
        state.tabs[tabKey]._page = page;
        state.tabs[tabKey]._search = search || "";
        state.tabs[tabKey].items = data.items || [];
        state.tabs[tabKey].pagination = data.pagination || {};
        if (data.counts) {
          state.counts = data.counts;
        }
      })
      .addCase(fetchUploads.rejected, (state, action) => {
        const { tabKey } = action.meta.arg;
        if (!state.tabs[tabKey]) state.tabs[tabKey] = makeTab();
        state.tabs[tabKey]._loading = false;
        state.tabs[tabKey]._error =
          action.payload?.error?.message || action.error?.message || "Failed to load";
      });
  },
});

export const { setSearch, resetTab } = adminUploadsSlice.actions;
export default adminUploadsSlice.reducer;
