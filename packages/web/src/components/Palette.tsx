import { Circle, Diamond, Play, Plus, Save, Upload } from "lucide-react";
import { useFlowStore } from "../store/flowStore";
import type { FlowNodeKind } from "../types/flow";

const blockButtons: Array<{ kind: FlowNodeKind; label: string; icon: typeof Circle }> = [
  { kind: "start", label: "Start", icon: Play },
  { kind: "assign", label: "Assignment", icon: Plus },
  { kind: "output", label: "Output", icon: Diamond },
  { kind: "end", label: "End", icon: Circle },
];

export const Palette = () => {
  const addNode = useFlowStore((state) => state.addNode);
  const newProject = useFlowStore((state) => state.newProject);
  const saveProject = useFlowStore((state) => state.saveProject);
  const loadProject = useFlowStore((state) => state.loadProject);

  return (
    <aside className="palette">
      <div className="brand">
        <span>Flowit</span>
      </div>

      <div className="tool-group">
        {blockButtons.map(({ kind, label, icon: Icon }) => (
          <button key={kind} type="button" onClick={() => addNode(kind)} title={`Aggiungi ${label}`}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="tool-group tool-group--bottom">
        <button type="button" onClick={newProject} title="Nuovo progetto">
          <Plus size={18} />
          <span>Nuovo</span>
        </button>
        <button type="button" onClick={saveProject} title="Salva nel browser">
          <Save size={18} />
          <span>Salva</span>
        </button>
        <button type="button" onClick={loadProject} title="Carica dal browser">
          <Upload size={18} />
          <span>Carica</span>
        </button>
      </div>
    </aside>
  );
};
