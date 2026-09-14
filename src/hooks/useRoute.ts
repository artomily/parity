import { useEffect, useState } from "react";

// Hash routing keeps the static Vercel deploy working with no rewrite rules:
// every page is served from the same index.html.
export type Route = "home" | "app" | "whitepaper";

const parse = (hash: string): Route => {
  const path = hash.replace(/^#\/?/, "").split(/[?#]/)[0];
  if (path === "app") return "app";
  if (path === "whitepaper") return "whitepaper";
  return "home";
};

export const href = (r: Route) => (r === "home" ? "#/" : `#/${r}`);

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
