# API Contracts: Gazebo-Unity Digital Twin Simulation

## Overview
This document defines the API contracts for the Gazebo-Unity digital twin simulation environment, focusing on the interfaces between the physics simulation (Gazebo), visual rendering (Unity), and user interaction systems.

## Simulation Management APIs

### Start Simulation
**Endpoint**: `POST /simulation/start`
**Description**: Starts the physics simulation and initializes the Unity rendering environment

**Request**:
```json
{
  "environment_id": "string",
  "robot_ids": ["string"],
  "real_time_factor": "float",
  "physics_engine": "string",
  "synchronization_enabled": "boolean"
}
```

**Response**:
```json
{
  "simulation_id": "string",
  "status": "string",
  "gazebo_port": "int",
  "unity_port": "int",
  "start_time": "timestamp",
  "error": "string"
}
```

**Validation**:
- `environment_id` must reference an existing simulation environment
- `real_time_factor` must be positive
- `physics_engine` must be a supported engine (ODE, Bullet, DART)

### Stop Simulation
**Endpoint**: `POST /simulation/stop`
**Description**: Stops the physics simulation and Unity rendering

**Request**:
```json
{
  "simulation_id": "string"
}
```

**Response**:
```json
{
  "simulation_id": "string",
  "status": "string",
  "stop_time": "timestamp",
  "error": "string"
}
```

**Validation**:
- `simulation_id` must reference an active simulation

### Pause Simulation
**Endpoint**: `POST /simulation/pause`
**Description**: Pauses the simulation while preserving state

**Request**:
```json
{
  "simulation_id": "string"
}
```

**Response**:
```json
{
  "simulation_id": "string",
  "status": "string",
  "error": "string"
}
```

### Resume Simulation
**Endpoint**: `POST /simulation/resume`
**Description**: Resumes a paused simulation

**Request**:
```json
{
  "simulation_id": "string"
}
```

**Response**:
```json
{
  "simulation_id": "string",
  "status": "string",
  "error": "string"
}
```

## Robot Control APIs

### Send Velocity Command
**Endpoint**: `POST /robot/{robot_id}/cmd_vel`
**Description**: Sends velocity commands to a robot

**Request**:
```json
{
  "linear": {
    "x": "float",
    "y": "float",
    "z": "float"
  },
  "angular": {
    "x": "float",
    "y": "float",
    "z": "float"
  },
  "timestamp": "timestamp"
}
```

**Response**:
```json
{
  "robot_id": "string",
  "command_accepted": "boolean",
  "timestamp": "timestamp",
  "error": "string"
}
```

**Validation**:
- Linear and angular velocities must be within safe limits
- Robot must exist and be active in the simulation

### Get Robot State
**Endpoint**: `GET /robot/{robot_id}/state`
**Description**: Retrieves the current state of a robot

**Response**:
```json
{
  "robot_id": "string",
  "pose": {
    "position": {"x": "float", "y": "float", "z": "float"},
    "orientation": {"x": "float", "y": "float", "z": "float", "w": "float"}
  },
  "velocity": {
    "linear": {"x": "float", "y": "float", "z": "float"},
    "angular": {"x": "float", "y": "float", "z": "float"}
  },
  "joint_states": [
    {
      "name": "string",
      "position": "float",
      "velocity": "float",
      "effort": "float"
    }
  ],
  "timestamp": "timestamp"
}
```

### Set Robot Position
**Endpoint**: `POST /robot/{robot_id}/set_position`
**Description**: Sets the absolute position of a robot (for reset purposes)

**Request**:
```json
{
  "position": {
    "x": "float",
    "y": "float",
    "z": "float"
  },
  "orientation": {
    "x": "float",
    "y": "float",
    "z": "float",
    "w": "float"
  }
}
```

**Response**:
```json
{
  "robot_id": "string",
  "position_set": "boolean",
  "error": "string"
}
```

## Sensor Data APIs

### Get LiDAR Data
**Endpoint**: `GET /robot/{robot_id}/sensor/lidar/{sensor_id}`
**Description**: Retrieves the latest LiDAR sensor data

**Response**:
```json
{
  "sensor_id": "string",
  "ranges": ["float"],
  "intensities": ["float"],
  "angle_min": "float",
  "angle_max": "float",
  "angle_increment": "float",
  "range_min": "float",
  "range_max": "float",
  "timestamp": "timestamp"
}
```

### Get Depth Camera Data
**Endpoint**: `GET /robot/{robot_id}/sensor/depth_camera/{sensor_id}`
**Description**: Retrieves the latest depth camera sensor data

**Response**:
```json
{
  "sensor_id": "string",
  "rgb_image": {
    "data": "base64",
    "width": "int",
    "height": "int",
    "encoding": "string"
  },
  "depth_image": {
    "data": "base64",
    "width": "int",
    "height": "int",
    "encoding": "string"
  },
  "camera_info": {
    "width": "int",
    "height": "int",
    "distortion_model": "string",
    "D": ["float"],
    "K": ["float"],
    "R": ["float"],
    "P": ["float"]
  },
  "timestamp": "timestamp"
}
```

### Get IMU Data
**Endpoint**: `GET /robot/{robot_id}/sensor/imu/{sensor_id}`
**Description**: Retrieves the latest IMU sensor data

**Response**:
```json
{
  "sensor_id": "string",
  "orientation": {
    "x": "float",
    "y": "float",
    "z": "float",
    "w": "float"
  },
  "angular_velocity": {
    "x": "float",
    "y": "float",
    "z": "float"
  },
  "linear_acceleration": {
    "x": "float",
    "y": "float",
    "z": "float"
  },
  "timestamp": "timestamp"
}
```

## Environment Management APIs

### Load Environment
**Endpoint**: `POST /environment/load`
**Description**: Loads a simulation environment

**Request**:
```json
{
  "environment_id": "string",
  "sdf_path": "string",
  "objects": [
    {
      "name": "string",
      "model_path": "string",
      "pose": {
        "position": {"x": "float", "y": "float", "z": "float"},
        "orientation": {"x": "float", "y": "float", "z": "float", "w": "float"}
      }
    }
  ]
}
```

**Response**:
```json
{
  "environment_id": "string",
  "loaded": "boolean",
  "objects_loaded": "int",
  "error": "string"
}
```

### Add Object to Environment
**Endpoint**: `POST /environment/{environment_id}/add_object`
**Description**: Adds an object to the current environment

**Request**:
```json
{
  "object_name": "string",
  "model_path": "string",
  "pose": {
    "position": {"x": "float", "y": "float", "z": "float"},
    "orientation": {"x": "float", "y": "float", "z": "float", "w": "float"}
  }
}
```

**Response**:
```json
{
  "object_id": "string",
  "added": "boolean",
  "error": "string"
}
```

## User Interaction APIs

### Send User Command
**Endpoint**: `POST /user/{user_id}/command`
**Description**: Sends a user command to the simulation

**Request**:
```json
{
  "command_type": "string",
  "target_robot_id": "string",
  "command_data": "object",
  "interface_type": "string"
}
```

**Response**:
```json
{
  "command_id": "string",
  "accepted": "boolean",
  "timestamp": "timestamp",
  "error": "string"
}
```

### Subscribe to Simulation Updates
**Endpoint**: `GET /simulation/{simulation_id}/stream`
**Description**: WebSocket endpoint for real-time simulation updates

**Stream Format**:
```json
{
  "type": "robot_state|sensor_data|environment_update",
  "data": "object",
  "timestamp": "timestamp"
}
```

## Error Handling

### Standard Error Response
All endpoints return errors in the following format:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object"
  }
}
```

### Common Error Codes
- `SIMULATION_NOT_FOUND`: Simulation with given ID does not exist
- `ROBOT_NOT_FOUND`: Robot with given ID does not exist
- `SENSOR_NOT_FOUND`: Sensor with given ID does not exist
- `ENVIRONMENT_NOT_FOUND`: Environment with given ID does not exist
- `INVALID_REQUEST`: Request parameters are invalid
- `SIMULATION_NOT_RUNNING`: Operation requires running simulation
- `PERMISSION_DENIED`: User lacks permission for operation

## Authentication & Authorization

All API endpoints require authentication using JWT tokens:
- Header: `Authorization: Bearer {token}`
- Token validity: 1 hour (renewable)
- Required scopes: `simulation:read`, `simulation:write`, `robot:control`, etc.

## Rate Limiting

- Standard endpoints: 100 requests/minute per user
- Sensor data endpoints: 60 requests/second per robot (to prevent overload)
- Streaming endpoints: 30 updates/second per connection