# Quickstart Guide: Gazebo-Unity Digital Twin Setup

## Overview
This guide provides step-by-step instructions for setting up the Gazebo-Unity digital twin simulation environment for educational robotics. Follow these steps to get your simulation environment running quickly.

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 22.04 LTS (recommended) or Windows 10/11
- **CPU**: 4+ cores (Intel i5/Ryzen 5 or better)
- **RAM**: 8GB minimum, 16GB recommended
- **GPU**: NVIDIA GTX 1060 or equivalent with OpenGL 4.5 support
- **Storage**: 10GB free space for simulation assets

### Software Dependencies
1. **ROS 2 Humble Hawksbill**
   - Installation: Follow official ROS 2 installation guide for your OS
   - Verify: `ros2 --version`

2. **Gazebo**
   - Gazebo Classic 11.x or Ignition Fortress/Edifice
   - Verify: `gz --version` (for Ignition) or check Gazebo Classic installation

3. **Unity Hub and Unity 2022.3 LTS**
   - Download from Unity website
   - Install Unity 2022.3 LTS with Universal Render Pipeline package

4. **Git**: For version control
5. **CMake 3.16+**: For building ROS packages
6. **Python 3.8+**: For ROS 2 nodes

## Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/robotics-ai-book.git
cd robotics-ai-book
git checkout 001-gazebo-unity-sim
```

### 2. Set Up ROS 2 Workspace
```bash
# Navigate to the ROS 2 workspace
cd ros2_ws

# Source ROS 2 environment
source /opt/ros/humble/setup.bash  # Ubuntu
# OR for Windows WSL: source /opt/ros/humble/setup.bat

# Install dependencies
rosdep install --from-paths src --ignore-src -r -y

# Build the workspace
colcon build --packages-select gazebo_models gazebo_plugins unity_bridge robot_control
```

### 3. Install Unity ROS TCP Connector
1. Open Unity Hub and create a new 3D project named "UnityGazeboBridge"
2. In Unity, go to Window → Package Manager
3. Click the "+" button → Add package from git URL
4. Enter: `https://github.com/Unity-Technologies/ROS-TCP-Connector.git`
5. Install the package

### 4. Configure Environment Variables
```bash
# Add to your ~/.bashrc (Ubuntu) or equivalent
export GAZEBO_MODEL_PATH=$GAZEBO_MODEL_PATH:$(pwd)/ros2_ws/src/gazebo_models/models
export GAZEBO_RESOURCE_PATH=$GAZEBO_RESOURCE_PATH:$(pwd)/ros2_ws/src/gazebo_models/worlds
export ROS_DOMAIN_ID=42  # Optional: isolate simulation traffic
```

## Basic Simulation Setup

### 1. Launch Gazebo Simulation
```bash
cd ros2_ws
source install/setup.bash
source /opt/ros/humble/setup.bash

# Launch the default simulation
ros2 launch unity_bridge simulation.launch.py
```

### 2. Launch Unity Visualizer
1. Open Unity Hub and load the "UnityGazeboBridge" project
2. In the Assets folder, open the "MainScene" scene
3. Press Play in the Unity editor to start the visualizer
4. The Unity scene should connect to the ROS 2 bridge and display the simulation

### 3. Verify Connection
Check that both systems are communicating:
```bash
# In a new terminal
source ros2_ws/install/setup.bash
source /opt/ros/humble/setup.bash

# List active ROS 2 topics
ros2 topic list

# You should see topics like:
# /tf, /tf_static, /robot1/cmd_vel, /robot1/lidar_scan, etc.
```

## Running Your First Simulation

### 1. Basic Robot Movement
```bash
# Send a velocity command to move the robot forward
ros2 topic pub /robot1/cmd_vel geometry_msgs/Twist "linear:
  x: 1.0
  y: 0.0
  z: 0.0
angular:
  x: 0.0
  y: 0.0
  z: 0.0"
```

### 2. Check Sensor Data
```bash
# Listen to LiDAR data
ros2 topic echo /robot1/lidar_scan sensor_msgs/LaserScan

# Listen to IMU data
ros2 topic echo /robot1/imu sensor_msgs/Imu
```

### 3. Using the Simulation API
The simulation provides a REST API for programmatic control:

```bash
# Start simulation
curl -X POST http://localhost:8080/simulation/start \
  -H "Content-Type: application/json" \
  -d '{
    "environment_id": "basic_world",
    "robot_ids": ["robot1"],
    "real_time_factor": 1.0
  }'

# Get robot state
curl -X GET http://localhost:8080/robot/robot1/state
```

## Troubleshooting Common Issues

### 1. Gazebo Not Launching
- Ensure all ROS 2 packages built successfully
- Check that Gazebo is properly installed: `gazebo --version`
- Verify environment variables are set correctly

### 2. Unity-ROS Connection Fails
- Check that both systems are on the same network (localhost)
- Verify Unity ROS TCP Connector is properly installed
- Ensure ROS_DOMAIN_ID matches between systems

### 3. Poor Performance
- Reduce rendering quality in Unity settings
- Lower physics update rate in Gazebo configuration
- Close unnecessary applications to free up system resources

### 4. Missing Models or Assets
- Verify all packages in ros2_ws/src are properly cloned
- Check that GAZEBO_MODEL_PATH includes the models directory
- Rebuild the ROS 2 workspace if needed

## Next Steps

### 1. Explore Example Scenarios
- Check the `/ros2_ws/launch` directory for different simulation scenarios
- Try the maze navigation example: `ros2 launch unity_bridge maze_navigation.launch.py`

### 2. Add Your Own Robot
- Create a URDF model in `/ros2_ws/src/gazebo_models/models/`
- Add sensors to your robot model
- Test in the simulation environment

### 3. Customize Environments
- Create new SDF world files in `/ros2_ws/worlds/`
- Design Unity scenes that match your Gazebo environments
- Implement custom Gazebo plugins for specialized behaviors

## Resources

- [ROS 2 Humble Documentation](https://docs.ros.org/en/humble/)
- [Gazebo Classic Documentation](http://gazebosim.org/tutorials?cat=install)
- [Unity ROS TCP Connector](https://github.com/Unity-Technologies/ROS-TCP-Connector)
- [Simulation Best Practices](../research.md)

## Support

For issues with the setup:
1. Check the troubleshooting section above
2. Review the detailed documentation in the `/docs` directory
3. Create an issue in the GitHub repository with your system specifications and error messages