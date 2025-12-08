# Data Model: AI-Robot Brain (NVIDIA Isaac™) & Vision-Language-Action (VLA)

## Module 3: AI-Robot Brain (NVIDIA Isaac™)

### Simulation Scene
- **Entity**: SimulationScene
- **Fields**:
  - scene_id (string): Unique identifier for the simulation scene
  - name (string): Human-readable name of the scene
  - description (string): Detailed description of the scene
  - lighting_conditions (object): Parameters for lighting (intensity, color, direction)
  - objects (array): List of objects in the scene with properties
  - physics_properties (object): Gravity, friction, collision parameters
  - sensors_config (object): Configuration for simulated sensors (cameras, LiDAR, IMU)
  - rendering_settings (object): Resolution, quality, performance parameters
- **Relationships**: One-to-many with SyntheticDataset
- **Validation**: Must have at least one object, valid lighting parameters
- **State transitions**: Draft → Validated → Active → Archived

### Perception Node
- **Entity**: PerceptionNode
- **Fields**:
  - node_id (string): Unique identifier for the perception node
  - name (string): Name of the perception node
  - type (string): Type of perception (object_detection, classification, depth_estimation)
  - input_topics (array): ROS 2 topics the node subscribes to
  - output_topics (array): ROS 2 topics the node publishes to
  - gpu_config (object): GPU settings and acceleration parameters
  - model_path (string): Path to the ML model used by the node
  - confidence_threshold (float): Minimum confidence for detections (0.0-1.0)
  - performance_metrics (object): FPS, latency, resource usage
- **Relationships**: Belongs to ROS2Network
- **Validation**: Must have valid input/output topics, model file exists
- **State transitions**: Configured → Running → Error/Completed

### VSLAM Map
- **Entity**: VSLAMMap
- **Fields**:
  - map_id (string): Unique identifier for the VSLAM map
  - name (string): Name of the map
  - landmarks (array): Visual landmarks with 3D coordinates
  - poses (array): Robot poses with timestamps
  - drift_metrics (object): Drift measurements and accuracy
  - map_quality (float): Quality score of the map (0.0-1.0)
  - creation_timestamp (datetime): When the map was created
  - last_updated (datetime): When the map was last modified
- **Relationships**: One-to-many with NavigationPath
- **Validation**: Must have minimum number of landmarks for stability
- **State transitions**: Initializing → Building → Stable → Updating

### Navigation Path
- **Entity**: NavigationPath
- **Fields**:
  - path_id (string): Unique identifier for the navigation path
  - name (string): Name of the path
  - waypoints (array): List of (x, y, z) coordinates
  - path_type (string): Type of path (global, local, emergency)
  - obstacles (array): Detected obstacles with positions
  - safety_margin (float): Minimum distance from obstacles
  - path_quality (float): Quality score of the path (0.0-1.0)
  - execution_status (string): Current status of path execution
- **Relationships**: Belongs to VSLAMMap
- **Validation**: Waypoints must be reachable, no collisions with known obstacles
- **State transitions**: Planned → Validated → Executing → Completed/Failed

## Module 4: Vision-Language-Action (VLA)

### Voice Command
- **Entity**: VoiceCommand
- **Fields**:
  - command_id (string): Unique identifier for the voice command
  - audio_data (string): Path to audio file or encoded audio
  - transcribed_text (string): Text transcribed from voice
  - confidence_score (float): Confidence in transcription (0.0-1.0)
  - timestamp (datetime): When the command was recorded
  - language (string): Language of the command
  - intent (string): Parsed intent from the command
  - parameters (object): Extracted parameters from the command
- **Relationships**: One-to-one with ActionSequence
- **Validation**: Must have valid audio data, minimum confidence score
- **State transitions**: Recorded → Transcribed → Parsed → Processed

### Action Sequence
- **Entity**: ActionSequence
- **Fields**:
  - sequence_id (string): Unique identifier for the action sequence
  - voice_command_id (string): Reference to the originating voice command
  - actions (array): List of actions with parameters
  - priority (integer): Priority level of the sequence (1-10)
  - safety_level (string): Safety classification (low, medium, high)
  - estimated_duration (float): Estimated time to complete sequence
  - execution_status (string): Current execution status
  - error_count (integer): Number of errors during execution
- **Relationships**: Belongs to VoiceCommand, one-to-many with ActionLog
- **Validation**: Must have valid actions, safety checks passed
- **State transitions**: Planned → Validated → Executing → Completed/Failed

### Cognitive Plan
- **Entity**: CognitivePlan
- **Fields**:
  - plan_id (string): Unique identifier for the cognitive plan
  - input_query (string): Original natural language query
  - parsed_plan (object): Structured representation of the plan
  - reasoning_trace (array): Steps of the reasoning process
  - safety_checks (object): Safety validation results
  - estimated_complexity (integer): Complexity level (1-10)
  - creation_timestamp (datetime): When the plan was created
  - execution_context (object): Context for plan execution
- **Relationships**: One-to-many with ActionSequence
- **Validation**: Must pass safety checks, valid structure
- **State transitions**: Requested → Planning → Validated → Ready

### Action Log
- **Entity**: ActionLog
- **Fields**:
  - log_id (string): Unique identifier for the log entry
  - action_sequence_id (string): Reference to the action sequence
  - action_type (string): Type of action performed
  - parameters (object): Parameters used for the action
  - timestamp (datetime): When the action was performed
  - status (string): Success, failure, or partial success
  - error_message (string): Error message if action failed
  - execution_time (float): Time taken to execute the action
- **Relationships**: Belongs to ActionSequence
- **Validation**: Must have valid action sequence reference
- **State transitions**: Started → Completed/Failed

## Common Entities

### ROS2 Network
- **Entity**: ROS2Network
- **Fields**:
  - network_id (string): Unique identifier for the ROS 2 network
  - nodes (array): List of active nodes in the network
  - topics (array): List of active topics
  - services (array): List of available services
  - parameters (object): Configuration parameters
  - status (string): Overall network status
- **Relationships**: Contains PerceptionNode, connects to other networks
- **Validation**: Must have valid ROS 2 configuration
- **State transitions**: Initializing → Active → Degraded → Inactive

### Hardware Configuration
- **Entity**: HardwareConfig
- **Fields**:
  - config_id (string): Unique identifier for the hardware config
  - gpu_model (string): Model of the GPU (e.g., RTX 3060)
  - gpu_memory (integer): GPU memory in GB
  - cpu_cores (integer): Number of CPU cores
  - ram_gb (integer): RAM in GB
  - supported_features (array): Features supported by this config
  - performance_rating (float): Performance rating (0.0-1.0)
- **Relationships**: Used by all other entities for performance tracking
- **Validation**: Must meet minimum requirements for each feature
- **State transitions**: Detected → Validated → Active