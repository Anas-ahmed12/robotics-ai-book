# API Contracts: AI-Robot Brain (NVIDIA Isaac™) & Vision-Language-Action (VLA)

## Module 3: AI-Robot Brain (NVIDIA Isaac™)

### Isaac Sim API Contracts

#### Simulation Scene Service
- **Service**: `/isaac_sim/create_scene`
- **Request**:
  - scene_config (object): Configuration parameters for the scene
    - name (string): Scene name
    - objects (array): List of objects to include
    - lighting (object): Lighting configuration
- **Response**:
  - scene_id (string): Unique identifier for created scene
  - status (string): Success or error status
  - message (string): Additional information

#### Synthetic Data Generation Service
- **Service**: `/isaac_sim/generate_dataset`
- **Request**:
  - scene_id (string): Scene to generate data from
  - dataset_config (object): Configuration for dataset generation
    - count (integer): Number of samples to generate
    - annotation_format (string): Format for annotations (COCO, YOLO, etc.)
- **Response**:
  - dataset_id (string): Unique identifier for generated dataset
  - path (string): Path to generated dataset
  - sample_count (integer): Number of samples generated
  - status (string): Success or error status

#### Rendering Performance Service
- **Service**: `/isaac_sim/rendering_metrics`
- **Request**: None (queries current rendering performance)
- **Response**:
  - fps (float): Current frames per second
  - resolution (object): Current rendering resolution
  - gpu_utilization (float): GPU utilization percentage
  - memory_usage (float): GPU memory usage in GB

### Isaac ROS Perception Nodes API Contracts

#### Object Detection Node
- **Topic**: `/perception/object_detection`
- **Message Type**: sensor_msgs/Image
- **Publisher**: Camera sensor
- **Subscriber**: ObjectDetectionNode
- **Response Topic**: `/perception/detections`
- **Response Message Type**: isaac_ros_interfaces/ObjectDetectionArray
  - detections (array): Array of detected objects
    - label (string): Object class label
    - confidence (float): Detection confidence (0.0-1.0)
    - bbox (object): Bounding box coordinates
      - x_min (float): Minimum X coordinate
      - y_min (float): Minimum Y coordinate
      - x_max (float): Maximum X coordinate
      - y_max (float): Maximum Y coordinate

#### Classification Node
- **Topic**: `/perception/classification`
- **Message Type**: sensor_msgs/Image
- **Publisher**: Camera sensor
- **Subscriber**: ClassificationNode
- **Response Topic**: `/perception/classifications`
- **Response Message Type**: isaac_ros_interfaces/ClassificationArray
  - classifications (array): Array of classifications
    - label (string): Classification label
    - confidence (float): Classification confidence (0.0-1.0)

### VSLAM and Navigation API Contracts

#### VSLAM Service
- **Service**: `/navigation/start_vslam`
- **Request**: None
- **Response**:
  - status (string): Success or error status
  - map_id (string): Unique identifier for created map
  - message (string): Additional information

- **Topic**: `/navigation/vslam/pose`
- **Message Type**: geometry_msgs/PoseStamped
- **Publisher**: VSLAMNode
- **Description**: Current robot pose estimated by VSLAM

#### Path Planning Service
- **Service**: `/navigation/compute_path`
- **Request**:
  - start_pose (object): Starting pose (x, y, theta)
  - goal_pose (object): Goal pose (x, y, theta)
  - tolerance (float): Tolerance for goal reach
- **Response**:
  - path (array): Array of waypoints (x, y, theta)
  - path_length (float): Length of computed path
  - status (string): Success or error status

#### Navigation Control Service
- **Service**: `/navigation/move_to_pose`
- **Request**:
  - pose (object): Target pose (x, y, theta)
  - tolerance (float): Tolerance for goal reach
- **Response**:
  - status (string): Execution status
  - message (string): Additional information

## Module 4: Vision-Language-Action (VLA)

### Voice Recognition API Contracts

#### Voice Command Service
- **Service**: `/voice/start_listening`
- **Request**: None
- **Response**:
  - status (string): Success or error status
  - session_id (string): Unique identifier for listening session

- **Service**: `/voice/stop_listening`
- **Request**: None
- **Response**:
  - status (string): Success or error status
  - command_id (string): Unique identifier for captured command

#### Voice-to-Text Service
- **Service**: `/voice/transcribe`
- **Request**:
  - audio_data (string): Audio data to transcribe
  - language (string): Language of the audio
- **Response**:
  - text (string): Transcribed text
  - confidence (float): Confidence in transcription (0.0-1.0)
  - status (string): Success or error status

### Cognitive Planning API Contracts

#### Cognitive Planning Service
- **Service**: `/cognitive_plan/create`
- **Request**:
  - query (string): Natural language query or command
  - context (object): Context information for planning
- **Response**:
  - plan_id (string): Unique identifier for created plan
  - actions (array): Array of planned actions
  - reasoning_trace (array): Steps of reasoning process
  - safety_score (float): Safety assessment score (0.0-1.0)
  - status (string): Success or error status

#### Action Execution Service
- **Service**: `/action/execute_sequence`
- **Request**:
  - sequence_id (string): ID of action sequence to execute
  - parameters (object): Execution parameters
- **Response**:
  - execution_id (string): Unique identifier for execution
  - status (string): Execution status
  - completion_time (float): Time taken for execution
  - error_message (string): Error message if failed

### LLM Integration API Contracts

#### LLM Query Service
- **Service**: `/llm/query`
- **Request**:
  - prompt (string): Input prompt for the LLM
  - parameters (object): LLM parameters (temperature, max_tokens, etc.)
- **Response**:
  - response (string): LLM response
  - tokens_used (integer): Number of tokens used
  - execution_time (float): Time taken for query
  - status (string): Success or error status

## Security and Authentication Contracts

#### Authentication Service
- **Service**: `/auth/login`
- **Request**:
  - username (string): User identifier
  - password (string): User password
- **Response**:
  - token (string): Authentication token
  - expires_in (integer): Token expiration time in seconds
  - status (string): Success or error status

#### Authorization Middleware
- **Requirement**: All services must validate authentication tokens
- **Header**: `Authorization: Bearer <token>`
- **Response for Unauthorized**: 401 status with error message