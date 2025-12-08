# Quickstart Guide: ROS 2 Robotics Education Module

## Prerequisites

- Ubuntu 22.04 LTS
- ROS 2 Humble Hawksbill installed
- Python 3.8+
- Basic Python programming knowledge
- Fundamental robotics concepts

## Installation

### 1. Install ROS 2 Humble
```bash
# Add ROS 2 GPG key and repository
sudo apt update && sudo apt install -y curl gnupg lsb-release
sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key -o /usr/share/keyrings/ros-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://packages.ros.org/ros2/ubuntu $(source /etc/os-release && echo $UBUNTU_CODENAME) main" | sudo tee /etc/apt/sources.list.d/ros2.list > /dev/null

# Install ROS 2 Humble packages
sudo apt update
sudo apt install -y ros-humble-desktop python3-rosdep2
sudo apt install -y python3-colcon-common-extensions
```

### 2. Initialize rosdep
```bash
sudo rosdep init
rosdep update
```

### 3. Source ROS 2 environment
```bash
source /opt/ros/humble/setup.bash
```

## Project Setup

### 1. Create ROS 2 workspace
```bash
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws
```

### 2. Create a package for the ROS 2 nodes
```bash
cd ~/ros2_ws/src
ros2 pkg create --build-type ament_python robot_nodes
```

### 3. Set up the package structure
```bash
cd ~/ros2_ws/src/robot_nodes
mkdir -p robot_nodes
```

## Basic Node Example

### 1. Create a simple publisher node
Create `~/ros2_ws/src/robot_nodes/robot_nodes/simple_publisher.py`:

```python
import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class SimplePublisher(Node):
    def __init__(self):
        super().__init__('simple_publisher')
        self.publisher = self.create_publisher(String, 'robot_commands', 10)
        timer_period = 1  # seconds
        self.timer = self.create_timer(timer_period, self.timer_callback)
        self.i = 0

    def timer_callback(self):
        msg = String()
        msg.data = f'Hello Robot: {self.i}'
        self.publisher.publish(msg)
        self.get_logger().info(f'Publishing: "{msg.data}"')
        self.i += 1

def main(args=None):
    rclpy.init(args=args)
    simple_publisher = SimplePublisher()
    rclpy.spin(simple_publisher)
    simple_publisher.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

### 2. Create a simple subscriber node
Create `~/ros2_ws/src/robot_nodes/robot_nodes/simple_subscriber.py`:

```python
import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class SimpleSubscriber(Node):
    def __init__(self):
        super().__init__('simple_subscriber')
        self.subscription = self.create_subscription(
            String,
            'robot_commands',
            self.listener_callback,
            10)
        self.subscription  # prevent unused variable warning

    def listener_callback(self, msg):
        self.get_logger().info(f'I heard: "{msg.data}"')

def main(args=None):
    rclpy.init(args=args)
    simple_subscriber = SimpleSubscriber()
    rclpy.spin(simple_subscriber)
    simple_subscriber.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

### 3. Update setup.py
Update `~/ros2_ws/src/robot_nodes/setup.py` to include entry points:

```python
from setuptools import setup
import os
from glob import glob

package_name = 'robot_nodes'

setup(
    name=package_name,
    version='0.0.0',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        (os.path.join('share', package_name, 'launch'), glob('launch/*.py')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='Your Name',
    maintainer_email='your.email@example.com',
    description='Simple ROS 2 nodes for educational purposes',
    license='Apache License 2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'simple_publisher = robot_nodes.simple_publisher:main',
            'simple_subscriber = robot_nodes.simple_subscriber:main',
        ],
    },
)
```

## Building and Running

### 1. Build the workspace
```bash
cd ~/ros2_ws
colcon build --packages-select robot_nodes
```

### 2. Source the workspace
```bash
source ~/ros2_ws/install/setup.bash
```

### 3. Run the nodes
In separate terminals:

Terminal 1:
```bash
ros2 run robot_nodes simple_publisher
```

Terminal 2:
```bash
ros2 run robot_nodes simple_subscriber
```

## Creating a Launch File

Create `~/ros2_ws/src/robot_nodes/launch/simple_launch.py`:

```python
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        Node(
            package='robot_nodes',
            executable='simple_publisher',
            name='simple_publisher',
            output='screen'
        ),
        Node(
            package='robot_nodes',
            executable='simple_subscriber',
            name='simple_subscriber',
            output='screen'
        )
    ])
```

### Run with launch file:
```bash
cd ~/ros2_ws
source install/setup.bash
ros2 launch robot_nodes simple_launch.py
```

## Creating a Service

### 1. Create a service server
Create `~/ros2_ws/src/robot_nodes/robot_nodes/simple_service.py`:

```python
import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts

class SimpleService(Node):
    def __init__(self):
        super().__init__('simple_service')
        self.srv = self.create_service(AddTwoInts, 'add_two_ints', self.add_two_ints_callback)

    def add_two_ints_callback(self, request, response):
        response.sum = request.a + request.b
        self.get_logger().info(f'Returning {request.a} + {request.b} = {response.sum}')
        return response

def main(args=None):
    rclpy.init(args=args)
    simple_service = SimpleService()
    rclpy.spin(simple_service)
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

### 2. Create a service client
Create `~/ros2_ws/src/robot_nodes/robot_nodes/simple_client.py`:

```python
import sys
import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts

class SimpleClient(Node):
    def __init__(self):
        super().__init__('simple_client')
        self.cli = self.create_client(AddTwoInts, 'add_two_ints')
        while not self.cli.wait_for_service(timeout_sec=1.0):
            self.get_logger().info('Service not available, waiting again...')
        self.req = AddTwoInts.Request()

    def send_request(self, a, b):
        self.req.a = a
        self.req.b = b
        self.future = self.cli.call_async(self.req)
        rclpy.spin_until_future_complete(self, self.future)
        return self.future.result()

def main(args=None):
    rclpy.init(args=args)
    simple_client = SimpleClient()
    response = simple_client.send_request(int(sys.argv[1]), int(sys.argv[2]))
    if response is not None:
        simple_client.get_logger().info(f'Result of add_two_ints: {response.sum}')
    else:
        simple_client.get_logger().info('Service call failed')
    simple_client.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

### Update setup.py with new entry points:
Add to the 'console_scripts' list in setup.py:
```
'simple_service = robot_nodes.simple_service:main',
'simple_client = robot_nodes.simple_client:main',
```

## URDF Example

Create a simple URDF file `~/ros2_ws/src/robot_nodes/robot_nodes/simple_robot.urdf`:

```xml
<?xml version="1.0"?>
<robot name="simple_humanoid">
  <!-- Base link -->
  <link name="base_link">
    <visual>
      <geometry>
        <box size="0.5 0.2 0.2"/>
      </geometry>
      <material name="blue">
        <color rgba="0 0 1 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <box size="0.5 0.2 0.2"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="1.0"/>
      <inertia ixx="0.1" ixy="0.0" ixz="0.0" iyy="0.1" iyz="0.0" izz="0.1"/>
    </inertial>
  </link>

  <!-- Head link -->
  <link name="head">
    <visual>
      <geometry>
        <sphere radius="0.1"/>
      </geometry>
      <material name="white">
        <color rgba="1 1 1 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <sphere radius="0.1"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.2"/>
      <inertia ixx="0.001" ixy="0.0" ixz="0.0" iyy="0.001" iyz="0.0" izz="0.001"/>
    </inertial>
  </link>

  <!-- Joint connecting base to head -->
  <joint name="neck_joint" type="fixed">
    <parent link="base_link"/>
    <child link="head"/>
    <origin xyz="0.0 0.0 0.3"/>
  </joint>

  <!-- Left arm link -->
  <link name="left_arm">
    <visual>
      <geometry>
        <box size="0.05 0.3 0.05"/>
      </geometry>
      <material name="red">
        <color rgba="1 0 0 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <box size="0.05 0.3 0.05"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.1"/>
      <inertia ixx="0.001" ixy="0.0" ixz="0.0" iyy="0.001" iyz="0.0" izz="0.001"/>
    </inertial>
  </link>

  <!-- Joint connecting base to left arm -->
  <joint name="left_shoulder_joint" type="revolute">
    <parent link="base_link"/>
    <child link="left_arm"/>
    <origin xyz="0.2 0.0 0.0"/>
    <axis xyz="0 1 0"/>
    <limit lower="-1.57" upper="1.57" effort="10.0" velocity="1.0"/>
  </joint>
</robot>
```

## Visualization

### View URDF in rviz2:
```bash
# Terminal 1: Start rviz2
rviz2

# Terminal 2: Publish robot description
ros2 run robot_state_publisher robot_state_publisher --ros-args -p robot_description:=$(cat ~/ros2_ws/src/robot_nodes/robot_nodes/simple_robot.urdf)
```

## Python Agent Integration

Create a simple Python agent that communicates with ROS 2 nodes:

Create `~/ros2_ws/src/robot_nodes/robot_nodes/agent_bridge.py`:

```python
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
import time

class AgentBridge(Node):
    def __init__(self):
        super().__init__('agent_bridge')
        self.publisher = self.create_publisher(String, 'agent_commands', 10)
        self.subscription = self.create_subscription(
            String,
            'robot_feedback',
            self.feedback_callback,
            10)
        self.get_logger().info('Agent bridge initialized')

    def send_command(self, command):
        msg = String()
        msg.data = command
        self.publisher.publish(msg)
        self.get_logger().info(f'Agent sent: "{command}"')

    def feedback_callback(self, msg):
        self.get_logger().info(f'Agent received feedback: "{msg.data}"')

def main(args=None):
    rclpy.init(args=args)
    agent_bridge = AgentBridge()

    # Send some commands
    for i in range(5):
        agent_bridge.send_command(f'Command from agent: {i}')
        time.sleep(1)

    rclpy.spin(agent_bridge)
    agent_bridge.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

## Next Steps

1. Experiment with different message types
2. Add more complex URDF models
3. Implement error handling in your nodes
4. Create more sophisticated launch files
5. Explore Gazebo simulation with your robot model