# ADR-004: VSLAM Navigation Architecture

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Proposed
- **Date:** 2025-12-07
- **Feature:** 002-ai-robot-brain
- **Context:** Need to establish a robust navigation system for humanoid robots that combines visual SLAM with traditional navigation approaches. The decision impacts how engineers will implement mapping, path planning, and obstacle avoidance specifically for bipedal robot locomotion.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security?
     2) Alternatives: Multiple viable options considered with tradeoffs?
     3) Scope: Cross-cutting concern (not an isolated detail)?
     If any are false, prefer capturing as a PHR note instead of an ADR. -->

## Decision

- **SLAM Approach**: Visual SLAM (VSLAM) - provides mapping capabilities using visual sensors without requiring LiDAR
- **Navigation Stack**: Nav2 - ROS 2 navigation framework adapted for humanoid bipedal movement
- **Path Planning**: A* and Dijkstra algorithms - optimized for humanoid locomotion patterns
- **Obstacle Avoidance**: Dynamic Window Approach (DWA) - adapted for bipedal robot movement constraints
- **Mapping System**: OctoMap integration - provides 3D mapping for humanoid navigation
- **Performance Target**: VSLAM with &lt;5% drift over 100m paths
- **Humanoid-Specific Adaptation**: Bipedal movement constraints in path planning - ensures stable humanoid locomotion

## Consequences

### Positive

- Visual SLAM eliminates need for expensive LiDAR sensors
- Nav2 provides proven navigation framework with extensive documentation
- &lt;5% drift over 100m paths ensures reliable long-term navigation
- Bipedal-specific path planning ensures stable humanoid movement
- Integration with ROS 2 ecosystem for seamless sensor and actuator control
- 3D mapping capabilities with OctoMap for complex environments
- Dynamic obstacle avoidance suitable for dynamic environments

### Negative

- VSLAM performance degrades in visually degraded conditions (low light, textureless environments)
- Bipedal movement constraints may limit path optimization compared to wheeled robots
- Computational requirements for visual processing may impact real-time performance
- VSLAM drift can accumulate over long distances
- Humanoid navigation algorithms may be less mature than wheeled robot approaches
- Visual features dependency may fail in repetitive environments
- Complex tuning required for bipedal-specific navigation parameters

## Alternatives Considered

- **Alternative A**: LiDAR-based SLAM (e.g., Cartographer, LOAM) + Nav2 - Would provide more reliable mapping but requires expensive LiDAR sensors and doesn't leverage visual capabilities
- **Alternative B**: GPS-assisted navigation - Would work outdoors but not suitable for indoor humanoid applications
- **Alternative C**: Pre-built maps with visual localization - Would reduce SLAM complexity but requires prior mapping of all operational environments
- **Alternative D**: Simple obstacle avoidance without mapping - Simpler but lacks long-term navigation capabilities for complex tasks

## References

- Feature Spec: specs/002-ai-robot-brain/spec.md
- Implementation Plan: specs/002-ai-robot-brain/plan.md
- Related ADRs: ADR-001 (ROS 2 Technology Stack), ADR-002 (NVIDIA Isaac Technology Stack)
- Evaluator Evidence: specs/002-ai-robot-brain/research.md