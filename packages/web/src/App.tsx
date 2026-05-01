import { FlowCanvas } from "./components/FlowCanvas";
import { Palette } from "./components/Palette";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { RuntimePanel } from "./components/RuntimePanel";

export const App = () => {
  return (
    <div className="app-shell">
      <Palette />
      <div className="workspace">
        <FlowCanvas />
        <RuntimePanel />
      </div>
      <PropertiesPanel />
    </div>
  );
};
