// MOESI Cache Coherence Protocol Simulator - Converted from TypeScript

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

// MOESI State Transitions
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

// Global state
let numProcessors = 2;
let caches = [];
let selectedProcessor = 0;
let operation = 'PrRd';
let selectedAddress = 0;
let data = '';
let transactionLog = [];
let memory = new Map();
let lastTransition = { p0: '', p1: '' };

// Helper functions
function createCacheLine() {
    return {
        state: 'I',
        data: null,
        tag: null,
        valid: false
    };
}

function createCache() {
    return {
        lines: Array(CACHE_LINES).fill(null).map(() => createCacheLine()),
        stats: { hits: 0, misses: 0 }
    };
}

function parseAddress(addr) {
    const addressNum = parseInt(addr, 16) || 0;
    const index = addressNum % CACHE_LINES;
    const tag = Math.floor(addressNum / CACHE_LINES);
    return { tag, index };
}

function getStateColor(state) {
    switch (state) {
        case 'M': return colors.primary;
        case 'O': return '#8B4513';
        case 'E': return '#9B59B6';
        case 'S': return colors.secondary;
        case 'I': return colors.neutral;
        default: return colors.text;
    }
}

function getHighlightStyle(transition) {
    if (!lastTransition.p0 && !lastTransition.p1) return {};
    
    const matchesP0 = lastTransition.p0 && lastTransition.p0.includes(`${transition.currentState}->${transition.nextState}`);
    const matchesP1 = lastTransition.p1 && lastTransition.p1.includes(`${transition.currentState}->${transition.nextState}`);
    
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
    
    return {};
}

function isHighlighted(transition) {
    if (!lastTransition.p0 && !lastTransition.p1) return false;
    
    const matchesP0 = lastTransition.p0 && lastTransition.p0.includes(`${transition.currentState}->${transition.nextState}`);
    const matchesP1 = lastTransition.p1 && lastTransition.p1.includes(`${transition.currentState}->${transition.nextState}`);
    
    return matchesP0 || matchesP1;
}

// Render functions
function renderStateTable() {
    const container = document.getElementById('state-table-container');
    if (!container) return;    
    container.innerHTML = `
        <div class="container">
            <div class="box has-text-centered" style="background-color: ${colors.white}; color: ${colors.primary};">
                <h4 class="title is-4 mb-4">MOESI Protocol State Transition Table</h4>
                
                <!-- Compact Highlight Legend -->
                <div class="field is-grouped is-grouped-centered is-grouped-multiline mb-4">
                    <div class="control">
                        <span class="tag is-medium" style="background-color: ${colors.text}; color: white;">Legend:</span>
                    </div>
                    <div class="control">
                        <div class="tags has-addons">
                            <span class="tag" style="background-color: ${colors.highlightP0}; border: 1px solid ${colors.primary};">&nbsp;</span>
                            <span class="tag is-light">P0</span>
                        </div>
                    </div>
                    <div class="control">
                        <div class="tags has-addons">
                            <span class="tag" style="background-color: ${colors.highlightP1}; border: 1px solid ${colors.accent};">&nbsp;</span>
                            <span class="tag is-light">P1</span>
                        </div>
                    </div>
                    <div class="control">
                        <div class="tags has-addons">
                            <span class="tag" style="background-color: ${colors.highlightBoth}; border: 1px solid ${colors.neutral};">&nbsp;</span>
                            <span class="tag is-light">Both</span>
                        </div>
                    </div>
                </div>
                
                ${(lastTransition.p0 || lastTransition.p1) ? `
                    <div class="field is-grouped is-grouped-centered is-grouped-multiline">
                        ${lastTransition.p0 ? `
                            <div class="control">
                                <div class="tag is-info is-medium">
                                    P0: ${lastTransition.p0}
                                </div>
                            </div>
                        ` : ''}
                        ${lastTransition.p1 ? `
                            <div class="control">
                                <div class="tag is-success is-medium">
                                    P1: ${lastTransition.p1}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
            
            <div class="box">
                <div class="table-container">
                    <table class="table is-striped is-hoverable is-fullwidth is-narrow">                    <thead>
                        <tr style="background-color: ${colors.accent};">
                            <th class="has-text-centered">Current State</th>
                            <th class="has-text-centered">Event</th>
                            <th class="has-text-centered">Condition</th>
                            <th class="has-text-centered">Next State</th>
                            <th class="has-text-centered">Bus Action</th>
                            <th class="has-text-left">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transitions.map((transition, index) => {
                            const highlightStyle = getHighlightStyle(transition);
                            const baseBackgroundColor = highlightStyle.backgroundColor || 
                                                        (index % 2 === 0 ? colors.white : colors.background);
                            
                            return `
                                <tr class="${isHighlighted(transition) ? 'has-text-weight-bold' : ''}" style="
                                    background-color: ${baseBackgroundColor};
                                    border-top: 1px solid ${colors.neutral};
                                    ${highlightStyle.borderLeft ? `border-left: ${highlightStyle.borderLeft};` : ''}
                                    ${highlightStyle.borderRight ? `border-right: ${highlightStyle.borderRight};` : ''}
                                ">
                                    <td class="has-text-centered has-text-weight-bold" style="color: ${getStateColor(transition.currentState)};">
                                        ${transition.currentState}
                                    </td>
                                    <td class="has-text-centered is-family-monospace">
                                        ${transition.event}
                                    </td>
                                    <td class="has-text-centered is-family-monospace">
                                        ${transition.condition || '--'}
                                    </td>
                                    <td class="has-text-centered has-text-weight-bold" style="color: ${getStateColor(transition.nextState)};">
                                        ${transition.nextState}
                                    </td>
                                    <td class="has-text-centered is-family-monospace">
                                        ${transition.busAction}
                                    </td>
                                    <td class="has-text-left">
                                        ${transition.description}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderCacheTable(processorId) {
    const cache = caches[processorId];
    if (!cache) return '';
    
    return cache.lines.map((line, index) => {
        const backgroundColor = line.valid ? colors.background : colors.white;
        return `            <tr class="${line.valid ? 'has-text-weight-semibold' : ''}" style="background-color: ${backgroundColor};">
                <td class="has-text-centered">0x${index.toString(16).toUpperCase()}</td>
                <td class="has-text-centered has-text-weight-bold" style="color: ${getStateColor(line.state)};">
                    ${line.state}
                </td>
                <td class="has-text-centered">${line.data || '-'}</td>
                <td class="has-text-centered">${line.valid ? 'Yes' : 'No'}</td>
            </tr>
        `;
    }).join('');
}

function renderCaches() {
    for (let i = 0; i < numProcessors; i++) {
        const tbody = document.getElementById(`cache-table-p${i}`);
        const stats = document.getElementById(`p${i}-stats`);
        
        if (tbody && caches[i]) {
            tbody.innerHTML = renderCacheTable(i);
        }
        
        if (stats && caches[i]) {
            const cache = caches[i];
            const total = cache.stats.hits + cache.stats.misses;
            const hitRate = total > 0 ? ((cache.stats.hits / total) * 100).toFixed(1) : '0.0';
            stats.textContent = `Hits: ${cache.stats.hits}, Misses: ${cache.stats.misses}${total > 0 ? ` (Hit Rate: ${hitRate}%)` : ''}`;
        }
    }
}

function renderTransactionLog() {
    const noOpsDiv = document.getElementById('no-operations');
    const logContainer = document.getElementById('transaction-log-container');
    const logBody = document.getElementById('transaction-log-body');
    
    if (transactionLog.length === 0) {
        if (noOpsDiv) noOpsDiv.style.display = 'block';
        if (logContainer) logContainer.style.display = 'none';
    } else {
        if (noOpsDiv) noOpsDiv.style.display = 'none';
        if (logContainer) logContainer.style.display = 'block';
        
        if (logBody) {
            logBody.innerHTML = transactionLog.map((entry, index) => {
                const backgroundColor = index === 0 ? colors.background : colors.white;
                const fontWeight = index === 0 ? 'font-bold' : '';
                
                return `
                    <tr class="${fontWeight}" style="background-color: ${backgroundColor}; border-top: 1px solid ${colors.neutral};">
                        <td class="p-2">${entry.processorActivity}</td>
                        <td class="p-2">${entry.busActivity}</td>
                        <td class="p-2">${entry.p0Content}</td>
                        <td class="p-2 font-bold" style="color: ${getStateColor(entry.p0State)};">
                            ${entry.p0State}
                        </td>
                        <td class="p-2 font-bold text-sm" style="color: ${colors.primary};">${entry.p0Transition}</td>
                        <td class="p-2">${entry.p1Content}</td>
                        <td class="p-2 font-bold" style="color: ${getStateColor(entry.p1State)};">
                            ${entry.p1State}
                        </td>
                        <td class="p-2 font-bold text-sm" style="color: ${colors.accent};">${entry.p1Transition}</td>
                        <td class="p-2">${entry.memoryContent}</td>
                    </tr>
                `;
            }).join('');
        }
    }
}

// Operation handling
function handleOperation() {
    const address = selectedAddress.toString();
    if (!address) return;
    
    const { tag, index } = parseAddress(address);
    const newCaches = caches.map(cache => JSON.parse(JSON.stringify(cache))); // Deep copy
    
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
    lastTransition = {
        p0: logEntry.p0Transition,
        p1: logEntry.p1Transition
    };

    caches = newCaches;
    transactionLog.unshift(logEntry);
    
    // Re-render everything
    renderStateTable();
    renderCaches();
    renderTransactionLog();
}

// Event handlers
function setupEventHandlers() {
    const processorSelect = document.getElementById('processor-select');
    const operationSelect = document.getElementById('operation-select');
    const addressSelect = document.getElementById('address-select');
    const dataInput = document.getElementById('data-input');
    const executeBtn = document.getElementById('execute-btn');

    if (processorSelect) {
        processorSelect.addEventListener('change', (e) => {
            selectedProcessor = parseInt(e.target.value);
        });
    }

    if (operationSelect) {
        operationSelect.addEventListener('change', (e) => {
            operation = e.target.value;
            if (dataInput) {
                dataInput.disabled = operation === 'PrRd';
                if (operation === 'PrRd') {
                    dataInput.style.backgroundColor = colors.background;
                } else {
                    dataInput.style.backgroundColor = colors.white;
                }
            }
        });
    }

    if (addressSelect) {
        addressSelect.addEventListener('change', (e) => {
            selectedAddress = Number(e.target.value);
        });
    }

    if (dataInput) {
        dataInput.addEventListener('input', (e) => {
            data = e.target.value;
        });
        // Initial state
        dataInput.disabled = operation === 'PrRd';
        dataInput.style.backgroundColor = operation === 'PrRd' ? colors.background : colors.white;
    }

    if (executeBtn) {
        executeBtn.addEventListener('click', handleOperation);
        
        // Hover effects
        executeBtn.addEventListener('mouseenter', () => {
            executeBtn.style.backgroundColor = colors.secondary;
        });
        executeBtn.addEventListener('mouseleave', () => {
            executeBtn.style.backgroundColor = colors.primary;
        });
    }
}

// Initialize the simulator
function initializeSimulator() {
    // Initialize caches
    caches = Array(numProcessors).fill(null).map(() => createCache());
    
    // Initial render
    renderStateTable();
    renderCaches();
    renderTransactionLog();
    
    // Setup event handlers
    setupEventHandlers();
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSimulator);
