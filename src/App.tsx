import { useRoute } from "./hooks/useRoute.js";
import { Landing } from "./pages/Landing.js";
import { Whitepaper } from "./pages/Whitepaper.js";
import { AppPage } from "./pages/AppPage.js";
import { Layout } from "./components/Layout.js";

export default function App() {
  const route = useRoute();

  // The app page owns the wallet hook, so the landing page and whitepaper
  // never touch a wallet extension.
  if (route === "app") return <AppPage />;

  return (
    <Layout route={route}>
      {route === "whitepaper" ? <Whitepaper /> : <Landing />}
    </Layout>
  );
}
