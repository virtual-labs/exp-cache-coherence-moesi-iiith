"use client";

import React, { useState, useEffect } from 'react';

const CACHE_LINES = 4;

const colors = {
  primary: '#176696',
  secondary: '#2C9AD1', 
  accent: '#98CB3B',
  neutral: '#96A0A3',
  white: '#FFFFFF',
  background: '#F8F9FA',
  text: '#2C3E50',
  highlightP0: '#BBDEFB',
  highlightP1: '#C8E6C8',
  highlightBoth: '#FFE0B2'
};

const MOESIStateTable = ({ p0Transition, p1Transition, activeProcessor }) => {
  const fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';

  const transitions = [
    // From Invalid (I)
    { currentState: 'I', event: 'PrRd', condition: '~S', nextState: 'E', busAction: 'BusRd', description: 'Read miss, no shared copies → Exclusive' },
    { currentState: 'I', event: 'PrRd', condition: 'S', nextState: 'S', busAction: 'BusRd', description: 'Read miss, shared copies exist → Shared' },
    { currentState: 'I', event: 'PrWr', condition: '', nextState: 'M', busAction: 'BusRdX', description: 'Write miss → Modified (invalidate others)' },
    { currentState: 'I', event: 'BusRd', condition: '', nextState: 'I', busAction: '--', description: 'Bus read (no action needed)' },
    { currentState: 'I', event: 'BusRdX', condition: '', nextState: 'I', busAction: '--', description: 'Bus read exclusive (no action needed)' },
    { currentState: 'I', event: 'BusUpgr', condition: '', nextState: 'I', busAction: '--', description: 'Bus upgrade (no action needed)' },
    
    // From Exclusive (E)
    { currentState: 'E', event: 'PrRd', condition: '', nextState: 'E', busAction: '--', description: 'Read hit in exclusive state' },
    { currentState: 'E', event: 'PrWr', condition: '', nextState: 'M', busAction: '--', description: 'Write hit → Modified (no bus traffic)' },
    { currentState: 'E', event: 'BusRd', condition: '', nextState: 'S', busAction: 'Flush', description: 'Another processor reads → Shared' },
    { currentState: 'E', event: 'BusRdX', condition: '', nextState: 'I', busAction: 'Flush', description: 'Another processor writes → Invalid' },
    
    // From Shared (S)
    { currentState: 'S', event: 'PrRd', condition: '', nextState: 'S', busAction: '--', description: 'Read hit in shared state' },
    { currentState: 'S', event: 'PrWr', condition: '', nextState: 'M', busAction: 'BusUpgr', description: 'Write hit → Modified (upgrade to exclusive)' },
    { currentState: 'S', event: 'BusRd', condition: '', nextState: 'S', busAction: '--', description: 'Another processor reads (stay shared)' },
    { currentState: 'S', event: 'BusRdX', condition: '', nextState: 'I', busAction: '--', description: 'Another processor writes → Invalid' },
    { currentState: 'S', event: 'BusUpgr', condition: '', nextState: 'I', busAction: '--', description: 'Another processor upgrades → Invalid' },
    
    // From Owned (O)
    { currentState: 'O', event: 'PrRd', condition: '', nextState: 'O', busAction: '--', description: 'Read hit in owned state' },
    { currentState: 'O', event: 'PrWr', condition: '', nextState: 'M', busAction: 'BusUpgr', description: 'Write hit → Modified (invalidate sharers)' },
    { currentState: 'O', event: 'BusRd', condition: '', nextState: 'O', busAction: 'Flush', description: 'Supply data to another processor (stay owned)' },
    { currentState: 'O', event: 'BusRdX', condition: '', nextState: 'I', busAction: 'Flush', description: 'Another processor writes → Invalid' },
    
    // From Modified (M)
    { currentState: 'M', event: 'PrRd', condition: '', nextState: 'M', busAction: '--', description: 'Read hit in modified state' },
    { currentState: 'M', event: 'PrWr', condition: '', nextState: 'M', busAction: '--', description: 'Write hit in modified state' },
    { currentState: 'M', event: 'BusRd', condition: '', nextState: 'O', busAction: 'Flush', description: 'Share dirty data → Owned' },
    { currentState: 'M', event: 'BusRdX', condition: '', nextState: 'I', busAction: 'Flush', description: 'Another processor writes → Invalid' }
  ];

  const getStateColor = (state) => {
    switch (state) {
      case 'M': return colors.primary;
      case 'O': return '#8B4513';
      case 'E': return '#9B59B6';
      case 'S': return colors.secondary;
      case 'I': return colors.neutral;
      default: return colors.text;
    }
  };

  const getHighlightStyle = (transition) => {
    if (!p0Transition && !p1Transition) return { backgroundColor: '' };
    
    const matchesP0 = p0Transition && p0Transition.includes(`${transition.currentState}->${transition.nextState}`);
    const matchesP1 = p1Transition && p1Transition.includes(`${transition.currentState}->${transition.nextState}`);
    
    if (matchesP0 && matchesP1) {
      return { 
        backgroundColor: colors.highlightBoth,
        borderLeft: `6px solid ${colors.primary}`,
        borderRight: `6px solid ${colors.accent}`
      };
    } else if (matchesP0) {
      return { 
        backgroundColor: colors.highlightP0,
        borderLeft: `6px solid ${colors.primary}`
      };
    } else if (matchesP1) {
      return { 
        backgroundColor: colors.highlightP1,
        borderLeft: `6px solid ${colors.accent}`
      };
    }
    
    return { backgroundColor: '' };
  };

  const isHighlighted = (transition) => {
    if (!p0Transition && !p1Transition) return false;
    
    const matchesP0 = p0Transition && p0Transition.includes(`${transition.currentState}->${transition.nextState}`);
    const matchesP1 = p1Transition && p1Transition.includes(`${transition.currentState}->${transition.nextState}`);
    
    return matchesP0 || matchesP1;
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div 
        className="mb-4 px-4 py-3 rounded-lg font-bold text-center border"
        style={{ 
          backgroundColor: colors.white,
          borderColor: colors.neutral,
          color: colors.primary,
          fontFamily
        }}
      >
        <div className="text-base md:text-lg mb-2">MOESI Protocol State Transition Table</div>
        
        {/* Compact Highlight Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs mb-3">
          <span style={{ color: colors.text }}>Legend:</span>
          <div className="flex items-center">
            <span 
              className="inline-block w-4 h-3 mr-1 border rounded"
              style={{ backgroundColor: colors.highlightP0, borderColor: colors.primary }}
            ></span>
            <span style={{ color: colors.text }}>P0</span>
          </div>
          <div className="flex items-center">
            <span 
              className="inline-block w-4 h-3 mr-1 border rounded"
              style={{ backgroundColor: colors.highlightP1, borderColor: colors.accent }}
            ></span>
            <span style={{ color: colors.text }}>P1</span>
          </div>
          <div className="flex items-center">
            <span 
              className="inline-block w-4 h-3 mr-1 border rounded"
              style={{ backgroundColor: colors.highlightBoth, borderColor: colors.neutral }}
            ></span>
            <span style={{ color: colors.text }}>Both</span>
          </div>
        </div>
        
        {(p0Transition || p1Transition) && (
          <div className="text-sm md:text-base font-bold">
            {p0Transition && (
              <div className="inline-block mr-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg font-bold">
                P0: {p0Transition}
              </div>
            )}
            {p1Transition && (
              <div className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-lg font-bold">
                P1: {p1Transition}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div 
        className="w-full bg-white rounded-lg p-4 shadow-md border overflow-x-auto"
        style={{ borderColor: colors.neutral }}
      >
        <table className="w-full text-xs md:text-sm">
          <thead>
            <tr style={{ backgroundColor: colors.accent }}>
              <th className="p-2 md:p-3 font-semibold text-left">Current State</th>
              <th className="p-2 md:p-3 font-semibold text-left">Event</th>
              <th className="p-2 md:p-3 font-semibold text-left">Condition</th>
              <th className="p-2 md:p-3 font-semibold text-left">Next State</th>
              <th className="p-2 md:p-3 font-semibold text-left">Bus Action</th>
              <th className="p-2 md:p-3 font-semibold text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            {transitions.map((transition, index) => {
              const highlightStyle = getHighlightStyle(transition);
              const baseBackgroundColor = highlightStyle.backgroundColor || 
                                        (index % 2 === 0 ? colors.white : colors.background);
              
              return (
                <tr 
                  key={index}
                  className={isHighlighted(transition) ? "font-bold" : ""}
                  style={{ 
                    backgroundColor: baseBackgroundColor,
                    borderTop: `1px solid ${colors.neutral}`,
                    borderLeft: highlightStyle.borderLeft || 'none',
                    borderRight: highlightStyle.borderRight || 'none'
                  }}
                >
                  <td 
                    className="p-2 md:p-3 font-bold text-center"
                    style={{ color: getStateColor(transition.currentState) }}
                  >
                    {transition.currentState}
                  </td>
                  <td className="p-2 md:p-3 font-mono text-center">
                    {transition.event}
                  </td>
                  <td className="p-2 md:p-3 font-mono text-center">
                    {transition.condition || '--'}
                  </td>
                  <td 
                    className="p-2 md:p-3 font-bold text-center"
                    style={{ color: getStateColor(transition.nextState) }}
                  >
                    {transition.nextState}
                  </td>
                  <td className="p-2 md:p-3 font-mono text-center">
                    {transition.busAction}
                  </td>
                  <td className="p-2 md:p-3">
                    {transition.description}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div 
        className="mt-4 p-3 rounded-lg text-xs md:text-sm"
        style={{ backgroundColor: colors.background }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <strong>Event Legend:</strong>
            <ul className="mt-1 space-y-1">
              <li><code>PrRd</code> - Processor Read</li>
              <li><code>PrWr</code> - Processor Write</li>
              <li><code>BusRd</code> - Bus Read</li>
            </ul>
          </div>
          <div>
            <strong>Condition Legend:</strong>
            <ul className="mt-1 space-y-1">
              <li><code>S</code> - Shared copies exist</li>
              <li><code>~S</code> - No shared copies</li>
              <li><code>--</code> - No condition</li>
            </ul>
          </div>
          <div>
            <strong>Bus Action Legend:</strong>
            <ul className="mt-1 space-y-1">
              <li><code>BusRdX</code> - Bus Read Exclusive</li>
              <li><code>BusUpgr</code> - Bus Upgrade</li>
              <li><code>Flush</code> - Write back to memory</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const createCacheLine = () => ({
  state: 'I',
  data: null,
  tag: null,
  valid: false
});

const createCache = () => ({
  lines: Array(CACHE_LINES).fill(null).map(() => createCacheLine()),
  stats: { hits: 0, misses: 0 }
});

const MOESISimulator = () => {
  const [numProcessors] = useState(2);
  const [caches, setCaches] = useState([]);
  const [selectedProcessor, setSelectedProcessor] = useState(0);
  const [operation, setOperation] = useState('PrRd');
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [data, setData] = useState('');
  const [transitionLog, setTransitionLog] = useState([]);
  const [memory] = useState(new Map());
  const [lastTransition, setLastTransition] = useState({ p0: '', p1: '' });

  useEffect(() => {
    setCaches(Array(numProcessors).fill(null).map(() => createCache()));
  }, [numProcessors]);

  const parseAddress = (addr) => {
    const addressNum = parseInt(addr, 16) || 0;
    const index = addressNum % CACHE_LINES;
    const tag = Math.floor(addressNum / CACHE_LINES);
    return { tag, index };
  };

  const handleOperation = () => {
    const address = selectedAddress.toString();
    if (!address) return;
    
    const { tag, index } = parseAddress(address);
    const newCaches = [...caches];
    
    const logEntry = {
      processorActivity: '',
      busActivity: '',
      p0Content: '-',
      p0State: '-',
      p0Transition: '',
      p1Content: '-',
      p1State: '-', 
      p1Transition: '',
      memoryContent: '-',
    };

    const currentCache = newCaches[selectedProcessor];
    const cacheLine = currentCache.lines[index];
    const otherProcessor = selectedProcessor === 0 ? 1 : 0;
    const otherCache = newCaches[otherProcessor];
    const otherCacheLine = otherCache.lines[index];

    const prevCurrentState = cacheLine.state;
    const prevOtherState = otherCacheLine.state;

    const modifiedCopy = (otherCacheLine.valid && otherCacheLine.tag === tag && (otherCacheLine.state === 'M' || otherCacheLine.state === 'O')) ? otherCache : null;
    const sharedCopy = (otherCacheLine.valid && otherCacheLine.tag === tag && (otherCacheLine.state === 'S' || otherCacheLine.state === 'E')) ? otherCache : null;
    
    let memContent = memory.get(address) || '0';

    if (operation === 'PrRd') {
      logEntry.processorActivity = `P${selectedProcessor} reads block X`;
      
      if (cacheLine.state === 'I') {
        if (sharedCopy) {
          logEntry.busActivity = 'BusRd';
          cacheLine.state = 'S';
          cacheLine.valid = true;
          cacheLine.tag = tag;
          cacheLine.data = otherCacheLine.data;
          
          if (otherCacheLine.state === 'E') {
            otherCacheLine.state = 'S';
          }
        } else if (modifiedCopy) {
          logEntry.busActivity = 'BusRd';
          cacheLine.state = 'S';
          cacheLine.valid = true;
          cacheLine.tag = tag;
          cacheLine.data = otherCacheLine.data;
          
          if (otherCacheLine.state === 'M') {
            otherCacheLine.state = 'O';
          }
          memContent = otherCacheLine.data || '0';
        } else {
          logEntry.busActivity = 'BusRd';
          cacheLine.state = 'E';
          cacheLine.valid = true;
          cacheLine.tag = tag;
          cacheLine.data = memContent;
        }
        currentCache.stats.misses++;
      } else {
        currentCache.stats.hits++;
      }
    } else if (operation === 'PrWr') {
      logEntry.processorActivity = `P${selectedProcessor} writes X=${data}`;
      
      if (cacheLine.state === 'I') {
        logEntry.busActivity = 'BusRdX';
        cacheLine.state = 'M';
        cacheLine.valid = true;
        cacheLine.tag = tag;
        cacheLine.data = data;
        
        if (otherCacheLine.valid && otherCacheLine.tag === tag) {
          otherCacheLine.state = 'I';
          otherCacheLine.valid = false;
        }
        currentCache.stats.misses++;
      } else if (cacheLine.state === 'S') {
        logEntry.busActivity = 'BusUpgr';
        cacheLine.state = 'M';
        cacheLine.data = data;
        currentCache.stats.hits++;
        
        if (otherCacheLine.valid && otherCacheLine.tag === tag) {
          otherCacheLine.state = 'I';
          otherCacheLine.valid = false;
        }
      } else if (cacheLine.state === 'E') {
        logEntry.busActivity = '-';
        cacheLine.state = 'M';
        cacheLine.data = data;
        currentCache.stats.hits++;
      } else if (cacheLine.state === 'M' || cacheLine.state === 'O') {
        logEntry.busActivity = '-';
        cacheLine.state = 'M';
        cacheLine.data = data;
        currentCache.stats.hits++;
      }
      memory.set(address, data);
      memContent = data;
    }

    if (selectedProcessor === 0) {
      logEntry.p0Transition = `${prevCurrentState}->${cacheLine.state}`;
      logEntry.p1Transition = `${prevOtherState}->${otherCacheLine.state}`;
    } else {
      logEntry.p0Transition = `${prevOtherState}->${otherCacheLine.state}`;
      logEntry.p1Transition = `${prevCurrentState}->${cacheLine.state}`;
    }

    logEntry.p0Content = newCaches[0].lines[index].data || '-';
    logEntry.p0State = newCaches[0].lines[index].state;
    logEntry.p1Content = newCaches[1].lines[index].data || '-';
    logEntry.p1State = newCaches[1].lines[index].state;
    logEntry.memoryContent = memContent;

    // Set the transitions for highlighting in the table
    setLastTransition({
      p0: logEntry.p0Transition,
      p1: logEntry.p1Transition
    });

    setCaches(newCaches);
    setTransitionLog(prev => [logEntry, ...prev]);
  };

  const fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';

  const getStateColor = (state) => {
    switch (state) {
      case 'M': return colors.primary;
      case 'O': return '#8B4513';
      case 'E': return '#9B59B6';
      case 'S': return colors.secondary;
      default: return colors.neutral;
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: colors.background,
        fontFamily,
        color: colors.text
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <header className="text-center mb-8">
          <h1 
            className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4"
            style={{ color: colors.primary }}
          >
            MOESI Cache Coherence Protocol Simulator
          </h1>
          <p className="text-base md:text-lg max-w-4xl mx-auto leading-relaxed">
            Interactive demonstration of the MOESI (Modified-Owned-Exclusive-Shared-Invalid) cache coherence protocol. 
            MOESI extends MSI by adding Owned (O) and Exclusive (E) states for better performance optimization.
          </p>
        </header>
        
        <section className="mb-8">
          <MOESIStateTable 
            p0Transition={lastTransition.p0}
            p1Transition={lastTransition.p1}
            activeProcessor={selectedProcessor}
          />
        </section>

        <section 
          className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-8 border"
          style={{ borderColor: colors.neutral }}
        >
          <h3 
            className="text-lg md:text-xl font-semibold mb-4"
            style={{ color: colors.primary }}
          >
            Simulation Controls
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex flex-col">
              <label className="block mb-2 font-semibold text-sm">Processor</label>
              <select
                className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: colors.neutral, backgroundColor: colors.white, color: colors.text }}
                value={selectedProcessor}
                onChange={(e) => setSelectedProcessor(parseInt(e.target.value))}
              >
                {Array(numProcessors).fill(null).map((_, i) => (
                  <option key={i} value={i}>Processor {i}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="block mb-2 font-semibold text-sm">Operation Type</label>
              <select
                className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: colors.neutral, backgroundColor: colors.white, color: colors.text }}
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
              >
                <option value="PrRd">PrRd (Processor Read)</option>
                <option value="PrWr">PrWr (Processor Write)</option>
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="block mb-2 font-semibold text-sm">Memory Address</label>
              <select
                className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: colors.neutral, backgroundColor: colors.white, color: colors.text }}
                value={selectedAddress}
                onChange={(e) => setSelectedAddress(Number(e.target.value))}
              >
                {[0, 1, 2, 3].map((loc) => (
                  <option key={loc} value={loc}>0x{loc.toString(16).toUpperCase()}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="block mb-2 font-semibold text-sm">Data Value (for writes)</label>
              <input
                type="text"
                value={data}
                onChange={(e) => setData(e.target.value)}
                disabled={operation === 'PrRd'}
                placeholder="Enter data value"
                className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                style={{ 
                  borderColor: colors.neutral,
                  backgroundColor: operation === 'PrRd' ? colors.background : colors.white,
                  color: colors.text
                }}
              />
            </div>
          </div>
          
          <div className="text-center">
            <button 
              onClick={handleOperation}
              className="px-8 py-3 font-bold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl focus:outline-none focus:ring-2 text-white text-sm md:text-base"
              style={{ backgroundColor: colors.primary }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.secondary; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.primary; }}
            >
              Execute Operation
            </button>
          </div>
        </section>

        <section className="mb-8">
          <h3 
            className="text-lg md:text-xl font-semibold text-center mb-6"
            style={{ color: colors.primary }}
          >
            Processor Cache States
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {caches.map((cache, i) => (
              <div 
                key={i} 
                className="bg-white rounded-lg border shadow-lg p-4"
                style={{ borderColor: colors.neutral }}
              >
                <h4 
                  className="font-bold mb-4 text-center text-sm md:text-lg"
                  style={{ color: colors.primary }}
                >
                  Processor {i} Cache
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm text-center">
                    <thead>
                      <tr style={{ backgroundColor: colors.accent }}>
                        <th className="p-2 md:p-3 font-semibold">Cache Index</th>
                        <th className="p-2 md:p-3 font-semibold">State</th>
                        <th className="p-2 md:p-3 font-semibold">Data</th>
                        <th className="p-2 md:p-3 font-semibold">Valid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cache.lines.map((line, j) => (
                        <tr 
                          key={j} 
                          className={line.valid ? "font-semibold" : ""}
                          style={{ 
                            backgroundColor: line.valid ? colors.background : colors.white,
                            borderTop: `1px solid ${colors.neutral}`
                          }}
                        >
                          <td className="p-2 md:p-3">0x{j.toString(16).toUpperCase()}</td>
                          <td 
                            className="p-2 md:p-3 font-bold"
                            style={{ color: getStateColor(line.state) }}
                          >
                            {line.state}
                          </td>
                          <td className="p-2 md:p-3">{line.data || '-'}</td>
                          <td className="p-2 md:p-3">{line.valid ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div 
                  className="mt-4 text-xs md:text-sm text-center p-2 rounded"
                  style={{ backgroundColor: colors.background }}
                >
                  <strong>Cache Performance:</strong> Hits: {cache.stats.hits}, Misses: {cache.stats.misses}
                  {(cache.stats.hits + cache.stats.misses > 0) && (
                    <span className="ml-2">
                      (Hit Rate: {((cache.stats.hits / (cache.stats.hits + cache.stats.misses)) * 100).toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
        
        <section 
          className="bg-white rounded-lg border shadow-lg p-4 md:p-6"
          style={{ borderColor: colors.neutral }}
        >
          <h3 
            className="text-lg md:text-xl font-semibold text-center mb-6"
            style={{ color: colors.primary }}
          >
            Bus Transaction Log & State Transitions
          </h3>
          
          {transitionLog.length === 0 ? (
            <div 
              className="text-center py-8 rounded-lg"
              style={{ backgroundColor: colors.background }}
            >
              <p className="text-sm md:text-base">
                No operations performed yet. Execute an operation to see the transaction log.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center">
                <thead>
                  <tr style={{ backgroundColor: colors.accent }}>
                    <th className="p-2 min-w-32 font-semibold">Processor Activity</th>
                    <th className="p-2 font-semibold">Bus Activity</th>
                    <th className="p-2 font-semibold">P0 Content</th>
                    <th className="p-2 font-semibold">P0 State</th>
                    <th className="p-2 font-semibold">P0 Transition</th>
                    <th className="p-2 font-semibold">P1 Content</th>
                    <th className="p-2 font-semibold">P1 State</th>
                    <th className="p-2 font-semibold">P1 Transition</th>
                    <th className="p-2 font-semibold">Memory</th>
                  </tr>
                </thead>
                <tbody>
                  {transitionLog.map((entry, i) => (
                    <tr 
                      key={i} 
                      className={i === 0 ? "font-bold" : ""}
                      style={{ 
                        backgroundColor: i === 0 ? colors.background : colors.white,
                        borderTop: `1px solid ${colors.neutral}`
                      }}
                    >
                      <td className="p-2">{entry.processorActivity}</td>
                      <td className="p-2">{entry.busActivity}</td>
                      <td className="p-2">{entry.p0Content}</td>
                      <td 
                        className="p-2 font-bold"
                        style={{ color: getStateColor(entry.p0State) }}
                      >
                        {entry.p0State}
                      </td>
                      <td className="p-2 font-bold text-sm" style={{ color: colors.primary }}>{entry.p0Transition}</td>
                      <td className="p-2">{entry.p1Content}</td>
                      <td 
                        className="p-2 font-bold"
                        style={{ color: getStateColor(entry.p1State) }}
                      >
                        {entry.p1State}
                      </td>
                      <td className="p-2 font-bold text-sm" style={{ color: colors.accent }}>{entry.p1Transition}</td>
                      <td className="p-2">{entry.memoryContent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section 
          className="mt-8 bg-white rounded-lg border shadow-lg p-4 md:p-6"
          style={{ borderColor: colors.neutral }}
        >
          <h3 
            className="text-lg md:text-xl font-semibold mb-4"
            style={{ color: colors.primary }}
          >
            Understanding the MOESI Protocol
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 
                className="font-semibold mb-3"
                style={{ color: colors.secondary }}
              >
                MOESI Protocol States:
              </h4>
              <ul className="space-y-2 text-sm">
                <li><strong style={{ color: colors.primary }}>M (Modified):</strong> Cache line is modified, exclusive, and dirty</li>
                <li><strong style={{ color: '#8B4513' }}>O (Owned):</strong> Cache line is owned by this cache, shared with others, responsible for memory updates</li>
                <li><strong style={{ color: '#9B59B6' }}>E (Exclusive):</strong> Cache line is exclusive, clean, and unmodified</li>
                <li><strong style={{ color: colors.secondary }}>S (Shared):</strong> Cache line is shared, clean, and read-only</li>
                <li><strong style={{ color: colors.neutral }}>I (Invalid):</strong> Cache line is invalid, not present in this cache</li>
              </ul>
            </div>
            
            <div>
              <h4 
                className="font-semibold mb-3"
                style={{ color: colors.secondary }}
              >
                Key MOESI Advantages:
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Owned state</strong> allows sharing dirty data without writing back to memory</li>
                <li>• <strong>Exclusive state</strong> enables silent transitions to Modified on writes</li>
                <li>• <strong>Reduced memory traffic</strong> through cache-to-cache transfers</li>
                <li>• <strong>Better performance</strong> for producer-consumer sharing patterns</li>
                <li>• <strong>Optimized writeback</strong> only when necessary</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 
              className="font-semibold mb-3"
              style={{ color: colors.secondary }}
            >
              How to Use This Simulator:
            </h4>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm list-decimal list-inside">
              <li>Select a processor (P0 or P1)</li>
              <li>Choose an operation (Read or Write)</li>
              <li>Select a memory address (0x0 to 0x3)</li>
              <li>For writes, enter a data value</li>
              <li>Click "Execute Operation" to see the protocol in action</li>
              <li>Observe state transitions highlighted in the table above</li>
            </ol>
          </div>

          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
            <h5 className="font-semibold mb-2" style={{ color: colors.primary }}>
              Try This Test Sequence:
            </h5>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li><strong>P0 reads</strong> 0x0 → I→E (Exclusive access, no other copies)</li>
              <li><strong>P1 reads</strong> 0x0 → P0: E→S, P1: I→S (Both share clean copy)</li>
              <li><strong>P0 writes</strong> "100" to 0x0 → P0: S→M, P1: S→I (P0 gets exclusive write)</li>
              <li><strong>P1 reads</strong> 0x0 → P0: M→O, P1: I→S (P0 owns, P1 shares dirty data)</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MOESISimulator;