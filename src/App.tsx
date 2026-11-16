import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "./index.css";
import PullToRefresh from "./ui/feedback/PullToRefresh";

function App() {
  return <><RouterProvider router={router} /><PullToRefresh /></>;
}

export default App;
