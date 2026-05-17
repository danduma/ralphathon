import { PhoneController } from "./components/PhoneController";
import { ScreenRace } from "./components/ScreenRace";

export function App() {
  const route = window.location.pathname;
  if (route.startsWith("/phone")) {
    return <PhoneController />;
  }
  return <ScreenRace />;
}
