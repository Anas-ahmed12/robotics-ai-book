# Quickstart: AI-Robot Brain (NVIDIA Isaac™) & Vision-Language-Action (VLA)

## Prerequisites

### Hardware Requirements
- **GPU**: NVIDIA RTX 3060 or equivalent (12GB+ VRAM recommended)
- **CPU**: Multi-core processor (Intel i7 or AMD Ryzen 7+)
- **RAM**: 32GB minimum (64GB recommended)
- **Storage**: 100GB+ free space for simulation assets
- **OS**: Ubuntu 22.04 LTS

### Software Requirements
- **ROS 2**: Humble Hawksbill
- **NVIDIA GPU Drivers**: 520+
- **CUDA**: 11.8+
- **Isaac Sim**: 2023.1.1+
- **Isaac ROS**: 3.0+
- **Python**: 3.10
- **OpenAI API Key** (for VLA module)

## Installation

### 1. System Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential build tools
sudo apt install build-essential cmake pkg-config -y

# Install Python 3.10 and pip
sudo apt install python3.10 python3.10-dev python3-pip -y

# Install ROS 2 Humble dependencies
sudo apt install python3-colcon-common-extensions python3-rosdep python3-vcstool -y
```

### 2. NVIDIA GPU Setup
```bash
# Install NVIDIA drivers (if not already installed)
sudo apt install nvidia-driver-535 -y

# Install CUDA Toolkit
wget https://developer.download.nvidia.com/compute/cuda/11.8.0/local_installers/cuda_11.8.0_520.61.05_linux.run
sudo sh cuda_11.8.0_520.61.05_linux.run

# Add CUDA to PATH
echo 'export PATH=/usr/local/cuda/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc
```

### 3. ROS 2 Humble Setup
```bash
# Add ROS 2 repository
sudo apt update && sudo apt install -y software-properties-common
sudo add-apt-repository universe
sudo apt update && sudo apt install curl -y
sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key -o /usr/share/keyrings/ros-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://packages.ros.org/ros2/ubuntu $(. /etc/os-release && echo $UBUNTU_CODENAME) main" | sudo tee /etc/apt/sources.list.d/ros2.list > /dev/null
sudo apt update
sudo apt install ros-humble-desktop python3-rosdep2 -y

# Source ROS 2
echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
source ~/.bashrc
```

### 4. Isaac Sim Installation
```bash
# Download Isaac Sim from NVIDIA Developer website
# Follow NVIDIA's installation guide for Isaac Sim 2023.1.1+
# Ensure Isaac Sim is properly configured with Omniverse

# Set Isaac Sim environment
export ISAACSIM_PATH=/path/to/isaac-sim
```

### 5. Isaac ROS Installation
```bash
# Clone Isaac ROS repository
mkdir -p ~/isaac_ros_ws/src
cd ~/isaac_ros_ws/src
git clone https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_common.git
git clone https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_benchmark.git
git clone https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_visual_slam.git
git clone https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_perceptor.git

# Install dependencies
cd ~/isaac_ros_ws
rosdep install --from-paths src --ignore-src -r -y

# Build workspace
colcon build --symlink-install
source install/setup.bash
```

### 6. OpenAI API Setup
```bash
# Install OpenAI Python package
pip3 install openai

# Set OpenAI API key (use environment variable for security)
export OPENAI_API_KEY="your-api-key-here"
```

## Module 3: AI-Robot Brain Quickstart

### Running Isaac Sim Simulation
```bash
# Launch Isaac Sim
cd $ISAACSIM_PATH
./isaac-sim.sh

# Or run with specific scene
./isaac-sim.sh --scene basic_cuboid_room
```

### Launching Perception Nodes
```bash
# Source ROS 2 and Isaac ROS workspace
source /opt/ros/humble/setup.bash
source ~/isaac_ros_ws/install/setup.bash

# Launch object detection node
ros2 launch isaac_ros_perceptor object_detection.launch.py

# Launch VSLAM node
ros2 launch isaac_ros_visual_slam visual_slam.launch.py
```

### Running Synthetic Data Generation
```bash
# Navigate to simulation directory
cd ~/robotics-ai-book/simulation/scenes

# Generate synthetic dataset
python3 generate_dataset.py --scene "basic_room" --count 1000 --output_path "./datasets/synthetic_data"
```

## Module 4: Vision-Language-Action Quickstart

### Voice Command Recognition
```bash
# Source ROS 2 workspace
source /opt/ros/humble/setup.bash
source ~/isaac_ros_ws/install/setup.bash

# Launch voice recognition node
ros2 run voice_recognition voice_node.py
```

### Cognitive Planning
```bash
# Run cognitive planning service
python3 cognitive_planner.py --query "Move the robot to the red cube" --context "simulation"
```

### Complete VLA Pipeline
```bash
# Launch all VLA components
source /opt/ros/humble/setup.bash
source ~/isaac_ros_ws/install/setup.bash

# Terminal 1: Launch Isaac Sim
./isaac-sim.sh

# Terminal 2: Launch ROS nodes
ros2 launch vla_pipeline.launch.py

# Terminal 3: Run voice command
python3 run_voice_command.py --command "Go to the kitchen and bring me the cup"
```

## Basic Commands

### Simulation Commands
```bash
# Start simulation
ros2 launch simulation bringup.launch.py

# Stop simulation
Ctrl+C in simulation terminal

# Reset simulation
ros2 service call /reset_simulation std_srvs/Empty
```

### Navigation Commands
```bash
# Send navigation goal
ros2 action send_goal /navigate_to_pose nav2_msgs/action/NavigateToPose "{pose: {pose: {position: {x: 1.0, y: 1.0, z: 0.0}, orientation: {w: 1.0}}, header: {frame_id: 'map'}}}"

# Cancel navigation
ros2 action cancel_goal /navigate_to_pose
```

### Voice Commands
```bash
# Available voice commands:
# - "Move forward 1 meter"
# - "Turn left/right"
# - "Stop robot"
# - "Go to the kitchen"
# - "Find the red object"
# - "Navigate to charging station"
```

## Troubleshooting

### Common Issues

#### Isaac Sim Not Starting
- Check GPU drivers: `nvidia-smi`
- Verify CUDA installation: `nvcc --version`
- Ensure Isaac Sim requirements are met

#### ROS Nodes Not Connecting
- Verify ROS_DOMAIN_ID: `echo $ROS_DOMAIN_ID`
- Check network setup: `ros2 topic list`
- Source ROS workspace: `source /opt/ros/humble/setup.bash`

#### Voice Recognition Not Working
- Check microphone access: `arecord -l`
- Verify OpenAI API key is set
- Test audio input: `arecord -D hw:0,0 -f cd test.wav`

#### VSLAM Drift Issues
- Ensure sufficient visual features in environment
- Check camera calibration
- Verify GPU acceleration is enabled

### Performance Optimization
```bash
# Check system resources
nvidia-smi
htop

# Optimize Isaac Sim settings
# In Isaac Sim UI: Window -> Settings -> Renderer
# Set to Performance mode for better FPS
```

## Next Steps

1. Complete the basic tutorials in the documentation
2. Experiment with custom simulation scenes
3. Implement your own perception nodes
4. Extend the voice command vocabulary
5. Create custom cognitive planning scenarios