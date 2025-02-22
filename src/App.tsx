import React, { useState, useEffect } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { Save, Download, HelpCircle } from 'lucide-react';

interface CalculationResult {
  timestamp: string;
  inputs: {
    P: number;
    M: number;
    B: number;
    D: number;
    e: number;
  };
  qmax: number;
  case: string;
}

function App() {
  const [P, setP] = useState<string>('3');
  const [M, setM] = useState<string>('10');
  const [B, setB] = useState<string>('1.2');
  const [D, setD] = useState<string>('1.5');
  const [e, setE] = useState<string>('0.1');
  const [qmax, setQmax] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [savedResults, setSavedResults] = useState<CalculationResult[]>([]);
  const [calculationCase, setCalculationCase] = useState<string>('');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const tooltips = {
    P: 'Applied axial load transmitted from the structure to the footing',
    M: 'Applied moment causing eccentricity in the footing',
    B: 'Total minor width of the footing',
    D: 'Total major width of pad footing',
    e: 'Eccentricity of the applied axial load',
  };

  const units = {
    P: 'kN',
    M: 'kN⋅m',
    B: 'm',
    D: 'm',
    e: 'm',
    qmax: 'kN/m²',
  };

  const exampleValues = {
    P: '3',
    M: '10',
    B: '1.2',
    D: '1.5',
    e: '0.1',
  };

  useEffect(() => {
    calculateQmax();
  }, [P, M, B, D, e]);

  const validateInputs = () => {
    const values = { P, M, B, D, e };
    for (const [key, value] of Object.entries(values)) {
      if (!value) return false;
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) return false;
    }
    return true;
  };

  const formatNumber = (num: number) => {
    return Number(num.toPrecision(3)).toString();
  };

  const calculateQmax = () => {
    if (!validateInputs()) {
      setQmax(null);
      setError('Please enter valid positive numbers for all fields');
      return;
    }

    const pVal = parseFloat(P);
    const mVal = parseFloat(M);
    const bVal = parseFloat(B);
    const dVal = parseFloat(D);
    const eVal = parseFloat(e);
    const ek = (mVal / pVal) || (1/6) * dVal;

    let result: number;
    let caseType: string;

    if (eVal < ek) {
      result = (pVal / (bVal * dVal)) + (6 * mVal / (bVal * dVal * dVal));
      caseType = 'Case A: e < ek';
    } else if (eVal === ek) {
      result = (pVal / (bVal * dVal)) + (6 * mVal / (bVal * dVal * dVal));
      caseType = 'Case B: e = ek';
    } else {
      result = pVal / ((3/2) * bVal * (dVal/2 - eVal));
      caseType = 'Case C: e > ek';
    }

    setQmax(result);
    setCalculationCase(caseType);
    setError('');
  };

  const saveResult = () => {
    if (qmax === null) return;

    const result: CalculationResult = {
      timestamp: new Date().toLocaleString(),
      inputs: {
        P: parseFloat(P),
        M: parseFloat(M),
        B: parseFloat(B),
        D: parseFloat(D),
        e: parseFloat(e),
      },
      qmax: qmax,
      case: calculationCase,
    };

    setSavedResults([...savedResults, result]);
  };

  const exportToCSV = () => {
    if (savedResults.length === 0) return;

    const headers = ['Timestamp', 'P (kN)', 'M (kN⋅m)', 'B (m)', 'D (m)', 'e (m)', 'qmax (kN/m²)', 'Case'];
    const csvContent = [
      headers.join(','),
      ...savedResults.map(result => [
        result.timestamp,
        formatNumber(result.inputs.P),
        formatNumber(result.inputs.M),
        formatNumber(result.inputs.B),
        formatNumber(result.inputs.D),
        formatNumber(result.inputs.e),
        formatNumber(result.qmax),
        result.case
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'footing_pressure_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Isolated Pad Footing Pressure</h1>
          
          <div className="mb-8">
            <BlockMath math="q_{max} = \frac{P}{BD} + \frac{6M}{BD^2}" />
          </div>

          {/* Input Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Input Parameters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries({ P, M, B, D, e }).map(([key, value]) => (
                <div key={key} className="relative">
                  <label className="flex items-center mb-2">
                    <InlineMath math={key} />
                    <div className="relative inline-block">
                      <HelpCircle 
                        className="ml-2 w-4 h-4 text-gray-400 cursor-help"
                        onMouseEnter={() => setActiveTooltip(key)}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                      {activeTooltip === key && (
                        <div className="absolute z-10 w-64 p-2 mt-1 text-sm text-white bg-gray-800 rounded-lg shadow-lg -left-1/2 transform -translate-x-1/2">
                          {tooltips[key as keyof typeof tooltips]}
                        </div>
                      )}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      ({units[key as keyof typeof units]})
                    </span>
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => {
                      const setValue = {
                        'P': setP,
                        'M': setM,
                        'B': setB,
                        'D': setD,
                        'e': setE,
                      }[key];
                      setValue(e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Example: ${exampleValues[key as keyof typeof exampleValues]}`}
                    step="any"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Results Section */}
          {error ? (
            <div className="mt-4 text-red-500">{error}</div>
          ) : qmax !== null && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Results</h2>
              <div className="space-y-4">
                <div className="text-lg">{calculationCase}</div>
                <div className="text-lg">
                  <InlineMath math="q_{max}" /> = {formatNumber(qmax)} {units.qmax}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={saveResult}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Result
                  </button>
                  {savedResults.length > 0 && (
                    <button
                      onClick={exportToCSV}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export to CSV
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Saved Results Table */}
        {savedResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Saved Results</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2"><InlineMath math="P" /> (kN)</th>
                    <th className="px-4 py-2"><InlineMath math="M" /> (kN⋅m)</th>
                    <th className="px-4 py-2"><InlineMath math="B" /> (m)</th>
                    <th className="px-4 py-2"><InlineMath math="D" /> (m)</th>
                    <th className="px-4 py-2"><InlineMath math="e" /> (m)</th>
                    <th className="px-4 py-2"><InlineMath math="q_{max}" /> (kN/m²)</th>
                    <th className="px-4 py-2">Case</th>
                  </tr>
                </thead>
                <tbody>
                  {savedResults.map((result, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-2">{result.timestamp}</td>
                      <td className="px-4 py-2">{formatNumber(result.inputs.P)}</td>
                      <td className="px-4 py-2">{formatNumber(result.inputs.M)}</td>
                      <td className="px-4 py-2">{formatNumber(result.inputs.B)}</td>
                      <td className="px-4 py-2">{formatNumber(result.inputs.D)}</td>
                      <td className="px-4 py-2">{formatNumber(result.inputs.e)}</td>
                      <td className="px-4 py-2">{formatNumber(result.qmax)}</td>
                      <td className="px-4 py-2">{result.case}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
