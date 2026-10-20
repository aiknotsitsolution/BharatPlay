export const promptLogin = (navigate, location) => {
  if (localStorage.getItem("token")) return false;

  navigate("/login", {
    state: {
      from: {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      },
    },
  });
  return true;
};
