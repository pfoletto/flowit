import { Play, RotateCcw } from "lucide-react";
import { useFlowStore } from "../store/flowStore";

export const RuntimePanel = () => {
  const runtime = useFlowStore((state) => state.runtime);
  const runProject = useFlowStore((state) => state.runProject);
  const resetRuntime = useFlowStore((state) => state.resetRuntime);
  const variableEntries = Object.entries(runtime.variables);

  return (
    <section className="runtime-panel">
      <div className="runtime-actions">
        <button type="button" onClick={runProject} title="Esegui">
          <Play size={18} />
          <span>Run</span>
        </button>
        <button type="button" onClick={resetRuntime} title="Reset runtime">
          <RotateCcw size={18} />
          <span>Reset</span>
        </button>
      </div>

      <div className="runtime-section">
        <h2>Output</h2>
        <pre>{runtime.output.length > 0 ? runtime.output.join("\n") : "Nessun output."}</pre>
      </div>

      <div className="runtime-section">
        <h2>Variabili</h2>
        {variableEntries.length > 0 ? (
          <table>
            <tbody>
              {variableEntries.map(([name, value]) => (
                <tr key={name}>
                  <th>{name}</th>
                  <td>{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Nessuna variabile.</p>
        )}
      </div>

      <div className="runtime-section">
        <h2>Errori</h2>
        <pre>{runtime.errors.length > 0 ? runtime.errors.join("\n") : "Nessun errore."}</pre>
      </div>
    </section>
  );
};
