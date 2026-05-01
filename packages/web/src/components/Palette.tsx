import { ChangeEvent, useRef } from "react";
import { Circle, Diamond, Download, FolderOpen, GitBranch, Keyboard, Play, Plus, Save, Upload } from "lucide-react";
import { useFlowStore } from "../store/flowStore";
import type { FlowNodeKind, FlowProject } from "../types/flow";

const blockButtons: Array<{ kind: FlowNodeKind; label: string; icon: typeof Circle }> = [
  { kind: "start", label: "Start", icon: Play },
  { kind: "input", label: "Input", icon: Keyboard },
  { kind: "assign", label: "Assignment", icon: Plus },
  { kind: "output", label: "Output", icon: Diamond },
  { kind: "if", label: "If", icon: GitBranch },
  { kind: "end", label: "End", icon: Circle },
];

export const Palette = () => {
  const projectName = useFlowStore((state) => state.project.name);
  const updateProjectName = useFlowStore((state) => state.updateProjectName);
  const addNode = useFlowStore((state) => state.addNode);
  const newProject = useFlowStore((state) => state.newProject);
  const saveProject = useFlowStore((state) => state.saveProject);
  const loadProject = useFlowStore((state) => state.loadProject);
  const exportProject = useFlowStore((state) => state.exportProject);
  const importProject = useFlowStore((state) => state.importProject);
  const setRuntimeErrors = useFlowStore((state) => state.setRuntimeErrors);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const importedProject = JSON.parse(await file.text()) as FlowProject;

      if (!Array.isArray(importedProject.nodes) || !Array.isArray(importedProject.edges)) {
        throw new Error("Il file non contiene un progetto Flowit valido.");
      }

      importProject(importedProject);
    } catch (error) {
      setRuntimeErrors([error instanceof Error ? error.message : "Import JSON non riuscito."]);
    }
  };

  return (
    <aside className="palette">
      <div className="brand">
        <span>Flowit</span>
      </div>

      <label className="project-name">
        <span>Diagramma</span>
        <input
          value={projectName}
          onChange={(event) => updateProjectName(event.target.value)}
          placeholder="Nome diagramma"
        />
      </label>

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
        <button type="button" onClick={exportProject} title="Esporta JSON">
          <Download size={18} />
          <span>Esporta</span>
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} title="Importa JSON">
          <FolderOpen size={18} />
          <span>Importa</span>
        </button>
        <input ref={fileInputRef} className="file-input" type="file" accept="application/json,.json" onChange={handleImport} />
      </div>
    </aside>
  );
};
