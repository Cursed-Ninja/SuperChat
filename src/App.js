import "./App.css";
import { useState, useEffect, createContext } from "react";
import HomeLarge from "./components/HomeLarge";
import HomeSmall from "./components/HomeSmall";

const isLightModeContext = createContext();
const setIsLightModeContext = createContext();

function App() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [layout, setLayout] = useState(
    window.innerWidth < 600 ? "Mobile" : "Desktop"
  );
  const [height, setHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) {
        setLayout("Mobile");
      } else {
        setLayout("Desktop");
      }
      setHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <isLightModeContext.Provider value={isLightMode}>
      <setIsLightModeContext.Provider value={setIsLightMode}>
        <div
          className={`App ${isLightMode ? "light" : ""}`}
          style={{ height: height }}
        >
          {layout === "Desktop" ? <HomeLarge /> : <HomeSmall />}
        </div>
      </setIsLightModeContext.Provider>
    </isLightModeContext.Provider>
  );
}

export default App;
export { isLightModeContext, setIsLightModeContext };
