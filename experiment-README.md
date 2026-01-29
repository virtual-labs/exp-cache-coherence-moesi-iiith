# MOESI Cache Coherence Protocol Experiment

## Overview

This experiment provides an interactive simulation environment for understanding the MOESI (Modified, Owned, Exclusive, Shared, Invalid) cache coherence protocol used in modern multiprocessor systems. Students will explore cache coherence mechanisms, state transitions, and the advantages of the MOESI protocol over simpler alternatives.

## Learning Objectives

After completing this experiment, students will be able to:

1. **Understand Cache Coherence**: Explain why cache coherence is necessary in multiprocessor systems
2. **Identify MOESI States**: Describe the five states and their characteristics
3. **Analyze State Transitions**: Trace how cache lines transition between states based on processor and bus operations
4. **Evaluate Performance**: Understand the performance implications of different coherence protocols
5. **Apply Knowledge**: Solve cache coherence problems using MOESI protocol principles

## Experiment Structure

### 1. Pre-Test Assessment
- **File**: `pretest.json`
- **Purpose**: Assess prerequisite knowledge of computer architecture and cache systems
- **Questions**: 9 questions covering beginner, intermediate, and advanced concepts
- **Topics Covered**:
  - Basic cache concepts
  - Multiprocessor systems
  - Memory hierarchy
  - Cache coherence fundamentals

### 2. Theory Section
- **File**: `theory.md`
- **Content**: Comprehensive explanation of MOESI protocol
- **Topics Covered**:
  - Introduction to cache coherence
  - MOESI state definitions
  - State transition mechanisms
  - Comparison with other protocols
  - Performance implications
  - Real-world applications

### 3. Interactive Simulation
- **File**: `simulation/index.html`
- **Features**:
  - Two-processor cache coherence simulator
  - Real-time state transition visualization
  - Transaction log with detailed explanations
  - MOESI state transition table with highlighting
  - Mobile-responsive design using Bulma framework

#### Simulation Components:
- **Control Panel**: Select processor, operation type, memory address, and data
- **Cache Display**: Visual representation of both processor caches
- **Transaction Log**: Step-by-step record of all operations and state changes
- **State Transition Table**: Complete MOESI transition matrix with highlighting
- **Statistics**: Cache hit/miss ratios for performance analysis

### 4. Procedure Guide
- **File**: `procedure.md`
- **Content**: Step-by-step instructions for using the simulation
- **Includes**:
  - Basic operation walkthroughs
  - Advanced scenarios
  - Experimental exercises
  - Analysis techniques
  - Common observations

### 5. Post-Test Assessment
- **File**: `posttest.json`
- **Purpose**: Evaluate learning outcomes after completing the experiment
- **Questions**: 9 questions focusing on practical application of MOESI concepts
- **Topics Covered**:
  - State transition analysis
  - Bus operation understanding
  - Cache-to-cache transfer mechanisms
  - Performance optimization
  - Protocol comparison

## Technical Implementation

### Frontend Technologies:
- **HTML5**: Semantic structure with accessibility features
- **CSS3**: Custom styles with Bulma framework for responsive design
- **JavaScript ES6+**: Interactive simulation logic with modern features

### Key Features:
- **Mobile-First Design**: Optimized for mobile devices (60%+ user base)
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation
- **Performance**: Efficient algorithms for real-time state updates
- **Validation**: Input validation with user-friendly feedback
- **Error Handling**: Graceful error management with helpful messages

### Browser Compatibility:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## File Structure

```
experiment/
├── README.md                 # This file
├── aim.md                   # Experiment objectives
├── experiment-name.md       # Experiment title
├── theory.md               # Theoretical background
├── procedure.md            # Step-by-step instructions
├── references.md           # Academic and technical references
├── contributors.md         # Team information
├── pretest.json           # Pre-assessment questions
├── posttest.json          # Post-assessment questions
└── simulation/
    ├── index.html         # Main simulation interface
    ├── css/
    │   └── main.css      # Custom styles and responsive design
    ├── js/
    │   └── main.js       # Simulation logic and interactions
    └── images/
        └── README.md     # Image documentation
```

## Usage Instructions

### For Students:
1. Complete the pre-test to assess your current knowledge
2. Read the theory section thoroughly
3. Follow the procedure guide to use the simulation
4. Experiment with different scenarios
5. Complete the post-test to evaluate your learning

### For Instructors:
- Use the simulation for classroom demonstrations
- Assign specific experimental exercises from the procedure guide
- Monitor student progress through pre/post-test results
- Customize scenarios for advanced students

## Assessment Strategy

### Pre-Test (Prerequisites):
- **Beginner (3 questions)**: Basic cache and multiprocessor concepts
- **Intermediate (3 questions)**: Cache coherence fundamentals
- **Advanced (3 questions)**: Protocol mechanisms and snooping

### Post-Test (Learning Outcomes):
- **Beginner (3 questions)**: MOESI state identification and basic transitions
- **Intermediate (3 questions)**: Bus operations and cache-to-cache transfers
- **Advanced (3 questions)**: Performance analysis and complex scenarios

### Grading Rubric:
- **Excellent (90-100%)**: Demonstrates mastery of all MOESI concepts
- **Good (80-89%)**: Understands most concepts with minor gaps
- **Satisfactory (70-79%)**: Grasps basic concepts, needs reinforcement
- **Needs Improvement (<70%)**: Requires additional study and practice

## Experimental Exercises

1. **Basic State Transitions**: Trace simple read/write operations
2. **Cache Hit Rate Analysis**: Compare performance under different access patterns
3. **Bus Traffic Optimization**: Design scenarios to minimize coherence overhead
4. **Protocol Comparison**: Analyze MOESI advantages over MSI/MESI protocols
5. **Scalability Analysis**: Examine behavior with increasing sharing patterns

## Contributing

This experiment was developed by the team at IIIT Hyderabad:

- **Subject Matter Expert**: Prof. Suresh Purini
- **Developers**: Sankalp Bhat, Siddhant Garg

For questions, suggestions, or contributions, please contact the development team.

## References

See `references.md` for a comprehensive list of academic papers, textbooks, and technical resources used in developing this experiment.

## License

This experiment is part of the Virtual Labs project and follows the project's licensing terms.
