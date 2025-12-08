# ADR-003: Vision-Language-Action (VLA) Architecture

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Proposed
- **Date:** 2025-12-07
- **Feature:** 002-ai-robot-brain
- **Context:** Need to establish an integrated architecture that combines visual perception, voice recognition, and cognitive planning for humanoid robot control. The decision impacts how engineers will structure multimodal AI integration, handle real-time voice processing, and implement cognitive planning capabilities.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security?
     2) Alternatives: Multiple viable options considered with tradeoffs?
     3) Scope: Cross-cutting concern (not an isolated detail)?
     If any are false, prefer capturing as a PHR note instead of an ADR. -->

## Decision

- **Voice Recognition**: OpenAI Whisper API - provides accurate voice-to-text conversion with cognitive planning response time <5 seconds
- **LLM Integration**: GPT-4/GPT-4o APIs - enables translation of natural language into safe and efficient action sequences
- **Perception Pipeline**: Isaac ROS perception nodes - integrates visual data for VLA decision making
- **Action Translation**: ROS 2 action servers - converts LLM outputs to ROS 2 commands for robot execution
- **Multimodal Fusion**: Custom integration layer - combines visual, voice, and cognitive inputs for decision making
- **Security Layer**: API key management and rate limiting - ensures secure access to LLM services
- **Performance Target**: Cognitive planning response time <5 seconds with voice recognition accuracy >90%

## Consequences

### Positive

- Industry-leading voice recognition accuracy with OpenAI Whisper
- Powerful cognitive planning capabilities with state-of-the-art LLMs
- Multimodal integration enabling complex autonomous behaviors
- Rapid development through proven API services
- High accuracy voice-to-action translation
- Scalable cloud-based processing for complex cognitive tasks
- Integration with existing ROS 2 ecosystem

### Negative

- API costs for Whisper and GPT-4/GPT-4o services
- Privacy concerns with sending voice data to external services
- Dependency on external API availability and rate limits
- Potential latency issues affecting real-time performance
- Subscription costs that scale with usage
- Limited control over model behavior and updates
- Potential data sovereignty issues for certain applications

## Alternatives Considered

- **Alternative A**: Self-hosted Whisper + open-source LLM (e.g., Llama 2/3) - Would provide more control and privacy but requires significant infrastructure and may not match API quality/performance
- **Alternative B**: Speech-to-text + rule-based command processing - Would avoid LLM costs but lacks cognitive planning and natural language understanding
- **Alternative C**: Different commercial APIs (e.g., Google Speech-to-Text + PaLM/Vertex AI) - Would provide alternative but potentially less proven quality and different pricing models
- **Alternative D**: Keyword-based voice commands with finite state machine - Simpler but much less flexible than natural language processing

## References

- Feature Spec: specs/002-ai-robot-brain/spec.md
- Implementation Plan: specs/002-ai-robot-brain/plan.md
- Related ADRs: ADR-001 (ROS 2 Technology Stack), ADR-002 (NVIDIA Isaac Technology Stack)
- Evaluator Evidence: specs/002-ai-robot-brain/research.md