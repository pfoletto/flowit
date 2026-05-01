import { FormEvent, useState } from "react";
import { Play, RotateCcw, StepForward } from "lucide-react";
import { useFlowStore } from "../store/flowStore";

export const RuntimePanel = () => {
  const [inputValue, setInputValue] = useState("");
  const runtime = useFlowStore((state) => state.runtime);
  const runProject = useFlowStore((state) => state.runProject);
  const stepProject = useFlowStore((state) => state.stepProject);
  const submitRuntimeInput = useFlowStore((state) => state.submitRuntimeInput);
  const resetRuntime = useFlowStore((state) => state.resetRuntime);
  const variableEntries = Object.entries(runtime.variables);

  const handleSubmitInput = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitRuntimeInput(inputValue);
    setInputValue("");
  };

  return (
    <section className="runtime-panel">
      <div className="runtime-actions">
        <button type="button" onClick={runProject} title="Esegui">
          <Play size={18} />
          <span>Run</span>
        </button>
        <button type="button" onClick={stepProject} title="Esegui un blocco">
          <StepForward size={18} />
          <span>Step</span>
        </button>
        <button type="button" onClick={resetRuntime} title="Reset runtime">
          <RotateCcw size={18} />
          <span>Reset</span>
        </button>
      </div>

      <div className="runtime-section runtime-section--input">
        <h2>Input</h2>
        {runtime.pendingInput ? (
          <form className="runtime-input-form" onSubmit={handleSubmitInput}>
            <label>
              <span>{runtime.pendingInput.prompt}</span>
              <input
                autoFocus
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={runtime.pendingInput.variable}
              />
            </label>
            <button type="submit">Invia</button>
          </form>
        ) : (
          <p>Nessun input richiesto.</p>
        )}
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
