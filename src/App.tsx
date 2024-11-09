import React, { useState } from "react";
import "./App.css";

const hexToDec = (hex: string): number => parseInt(hex, 16);
const decToHex = (dec: number): string =>
  dec.toString(16).toUpperCase().padStart(4, "0");

// Define register names as a TypeScript type for better type safety
type Register = "AX" | "BX" | "CX" | "DX" | "BP" | "SI" | "DI";
type MemoryMode = "base" | "index" | "base-index";

interface Registers {
  [key: string]: string;
}

interface Memory {
  [address: string]: string;
}

const App: React.FC = () => {
  const [registers, setRegisters] = useState<Registers>({
    AX: "0000",
    BX: "0000",
    CX: "0000",
    DX: "0000",
    BP: "0000",
    SI: "0000",
    DI: "0000",
  });

  const [memory, setMemory] = useState<Memory>({});
  const [stack, setStack] = useState<string[]>([]);
  const [offset, setOffset] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [source, setSource] = useState<string>("AX");
  const [destination, setDestination] = useState<string>("BX");

  // Calculate memory address based on addressing mode and offset
  const calculateAddress = (mode: MemoryMode): string => {
    const base = hexToDec(registers.BX);
    const index = hexToDec(registers.SI);
    const bp = hexToDec(registers.BP);
    const di = hexToDec(registers.DI);
    const off = hexToDec(offset);

    let address = 0;
    if (mode === "base") address = base + off;
    else if (mode === "index") address = index + off;
    else if (mode === "base-index") address = base + index + off;

    return decToHex(address);
  };

  // MOV instruction handling
  const handleMov = (): void => {
    if (destination.startsWith("M")) {
      const address = calculateAddress(
        destination.replace("M-", "") as MemoryMode
      );
      setMemory({ ...memory, [address]: registers[source as Register] });
    } else if (source.startsWith("M")) {
      const address = calculateAddress(source.replace("M-", "") as MemoryMode);
      setRegisters({ ...registers, [destination]: memory[address] || "0000" });
    } else {
      setRegisters({
        ...registers,
        [destination]: registers[source as Register],
      });
    }
  };

  // XCHG instruction handling
  const handleXchg = (): void => {
    if (destination.startsWith("M")) {
      const address = calculateAddress(
        destination.replace("M-", "") as MemoryMode
      );
      const temp = memory[address] || "0000";
      setMemory({ ...memory, [address]: registers[source as Register] });
      setRegisters({ ...registers, [source]: temp });
    } else if (source.startsWith("M")) {
      const address = calculateAddress(source.replace("M-", "") as MemoryMode);
      const temp = memory[address] || "0000";
      setMemory({ ...memory, [address]: registers[destination as Register] });
      setRegisters({ ...registers, [destination]: temp });
    } else {
      const temp = registers[source as Register];
      setRegisters({
        ...registers,
        [source]: registers[destination as Register],
        [destination]: temp,
      });
    }
  };

  // PUSH instruction handling
  const handlePush = (): void => {
    setStack([registers[source as Register], ...stack]);
  };

  // POP instruction handling
  const handlePop = (): void => {
    if (stack.length > 0) {
      setRegisters({ ...registers, [destination]: stack[0] });
      setStack(stack.slice(1));
    } else {
      alert("Stack is empty!");
    }
  };

  // Setting a value in a register (only HEX values)
  const handleSet = (): void => {
    if (/^[0-9A-Fa-f]{1,4}$/.test(inputValue)) {
      setRegisters({
        ...registers,
        [destination]: inputValue.toUpperCase().padStart(4, "0"),
      });
    } else {
      alert("Please enter a valid HEX value (1 to 4 characters).");
    }
    setInputValue("");
  };

  return (
    <div className="App">
      <h1>Assembler Simulator</h1>

      <div className="registers">
        <h2>Registers</h2>
        {Object.keys(registers).map((reg) => (
          <div key={reg}>
            <strong>{reg}:</strong> {registers[reg as Register]}
          </div>
        ))}
      </div>

      <div className="memory">
        <h2>Memory</h2>
        <p>(displayed in HEX format)</p>
        {Object.keys(memory).length === 0 ? (
          <p>Memory is empty</p>
        ) : (
          Object.keys(memory).map((addr) => (
            <div key={addr}>
              <strong>{addr}:</strong> {memory[addr]}
            </div>
          ))
        )}
      </div>

      <div className="stack">
        <h2>Stack</h2>
        <ul>
          {stack.length === 0 ? (
            <li>Stack is empty</li>
          ) : (
            stack.map((val, idx) => <li key={idx}>{val}</li>)
          )}
        </ul>
      </div>

      <div className="controls">
        <h2>Commands</h2>

        <div className="command">
          <label>
            Source:
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              {Object.keys(registers).map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
              <option value="M-base">Memory (Base)</option>
              <option value="M-index">Memory (Index)</option>
              <option value="M-base-index">Memory (Base-Index)</option>
            </select>
          </label>

          <label>
            Destination:
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {Object.keys(registers).map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
              <option value="M-base">Memory (Base)</option>
              <option value="M-index">Memory (Index)</option>
              <option value="M-base-index">Memory (Base-Index)</option>
            </select>
          </label>

          <label>
            Offset:
            <input
              type="text"
              value={offset}
              onChange={(e) => setOffset(e.target.value.toUpperCase())}
              placeholder="Offset (HEX)"
            />
          </label>
        </div>

        <button onClick={handleMov}>MOV</button>
        <button onClick={handleXchg}>XCHG</button>
        <button onClick={handlePush}>PUSH</button>
        <button onClick={handlePop}>POP</button>

        <div className="command">
          <label>
            Set {destination} to:
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              placeholder="HEX value"
            />
          </label>
          <button onClick={handleSet}>SET</button>
        </div>
      </div>
    </div>
  );
};

export default App;
