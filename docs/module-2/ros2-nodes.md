# ROS 2 Nodes Implementation

## Overview of ROS 2 Nodes

This section covers the implementation of essential ROS 2 nodes for robot control and sensor data processing. The nodes include:

- `/motor_controller`: Handles velocity commands and motor control
- `/imu_reader`: Processes IMU sensor data
- `/camera_stream`: Manages camera image streaming
- `/lidar_scan`: Processes LiDAR point cloud data

## Message Types

### Common Message Types Used

| Message Type | Package | Description |
|--------------|---------|-------------|
| `geometry_msgs/Twist` | geometry_msgs | Robot velocity commands (linear and angular) |
| `sensor_msgs/Imu` | sensor_msgs | Inertial measurement unit data |
| `sensor_msgs/Image` | sensor_msgs | Camera image data |
| `sensor_msgs/LaserScan` | sensor_msgs | 2D laser scan data |
| `nav_msgs/Odometry` | nav_msgs | Robot odometry data |
| `tf2_msgs/TFMessage` | tf2_msgs | Transform data between coordinate frames |

## Motor Controller Node

### Python Implementation

```python
#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from std_msgs.msg import Float64
import math


class MotorController(Node):
    def __init__(self):
        super().__init__('motor_controller')

        # Create subscription to cmd_vel topic
        self.subscription = self.create_subscription(
            Twist,
            'cmd_vel',
            self.cmd_vel_callback,
            10
        )
        self.subscription  # prevent unused variable warning

        # Create publishers for wheel velocity commands
        self.left_wheel_pub = self.create_publisher(
            Float64,
            'left_wheel_cmd',
            10
        )

        self.right_wheel_pub = self.create_publisher(
            Float64,
            'right_wheel_cmd',
            10
        )

        # Robot parameters
        self.wheel_radius = 0.08  # meters
        self.wheel_separation = 0.36  # meters (distance between wheels)
        self.max_wheel_speed = 5.0  # rad/s

        self.get_logger().info('Motor Controller Node Started')

    def cmd_vel_callback(self, msg):
        """
        Convert Twist command to individual wheel velocities
        """
        linear_vel = msg.linear.x
        angular_vel = msg.angular.z

        # Calculate wheel velocities for differential drive
        left_wheel_vel = (linear_vel - angular_vel * self.wheel_separation / 2.0) / self.wheel_radius
        right_wheel_vel = (linear_vel + angular_vel * self.wheel_separation / 2.0) / self.wheel_radius

        # Limit wheel velocities
        left_wheel_vel = max(min(left_wheel_vel, self.max_wheel_speed), -self.max_wheel_speed)
        right_wheel_vel = max(min(right_wheel_vel, self.max_wheel_speed), -self.max_wheel_speed)

        # Publish wheel commands
        left_msg = Float64()
        left_msg.data = left_wheel_vel
        self.left_wheel_pub.publish(left_msg)

        right_msg = Float64()
        right_msg.data = right_wheel_vel
        self.right_wheel_pub.publish(right_msg)

        self.get_logger().debug(f'Left: {left_wheel_vel:.2f}, Right: {right_wheel_vel:.2f}')


def main(args=None):
    rclpy.init(args=args)

    motor_controller = MotorController()

    try:
        rclpy.spin(motor_controller)
    except KeyboardInterrupt:
        pass
    finally:
        motor_controller.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

### C++ Implementation

```cpp
#include <rclcpp/rclcpp.hpp>
#include <geometry_msgs/msg/twist.hpp>
#include <std_msgs/msg/float64.hpp>
#include <memory>

class MotorController : public rclcpp::Node
{
public:
    MotorController() : Node("motor_controller")
    {
        // Create subscription to cmd_vel topic
        subscription_ = this->create_subscription<geometry_msgs::msg::Twist>(
            "cmd_vel",
            10,
            std::bind(&MotorController::cmd_vel_callback, this, std::placeholders::_1)
        );

        // Create publishers for wheel velocity commands
        left_wheel_pub_ = this->create_publisher<std_msgs::msg::Float64>("left_wheel_cmd", 10);
        right_wheel_pub_ = this->create_publisher<std_msgs::msg::Float64>("right_wheel_cmd", 10);

        // Robot parameters
        wheel_radius_ = 0.08;  // meters
        wheel_separation_ = 0.36;  // meters
        max_wheel_speed_ = 5.0;  // rad/s

        RCLCPP_INFO(this->get_logger(), "Motor Controller Node Started");
    }

private:
    void cmd_vel_callback(const geometry_msgs::msg::Twist::SharedPtr msg)
    {
        // Convert Twist command to individual wheel velocities
        double linear_vel = msg->linear.x;
        double angular_vel = msg->angular.z;

        // Calculate wheel velocities for differential drive
        double left_wheel_vel = (linear_vel - angular_vel * wheel_separation_ / 2.0) / wheel_radius_;
        double right_wheel_vel = (linear_vel + angular_vel * wheel_separation_ / 2.0) / wheel_radius_;

        // Limit wheel velocities
        left_wheel_vel = std::max(std::min(left_wheel_vel, max_wheel_speed_), -max_wheel_speed_);
        right_wheel_vel = std::max(std::min(right_wheel_vel, max_wheel_speed_), -max_wheel_speed_);

        // Publish wheel commands
        auto left_msg = std_msgs::msg::Float64();
        left_msg.data = left_wheel_vel;
        left_wheel_pub_->publish(left_msg);

        auto right_msg = std_msgs::msg::Float64();
        right_msg.data = right_wheel_vel;
        right_wheel_pub_->publish(right_msg);

        RCLCPP_DEBUG(this->get_logger(), "Left: %.2f, Right: %.2f", left_wheel_vel, right_wheel_vel);
    }

    rclcpp::Subscription<geometry_msgs::msg::Twist>::SharedPtr subscription_;
    rclcpp::Publisher<std_msgs::msg::Float64>::SharedPtr left_wheel_pub_;
    rclcpp::Publisher<std_msgs::msg::Float64>::SharedPtr right_wheel_pub_;

    double wheel_radius_;
    double wheel_separation_;
    double max_wheel_speed_;
};

int main(int argc, char * argv[])
{
    rclpy::init(argc, argv);
    rclpy::spin(std::make_shared<MotorController>());
    rclpy::shutdown();
    return 0;
}
```

## IMU Reader Node

### Python Implementation

```python
#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Imu
from std_msgs.msg import Float64
import math


class ImuReader(Node):
    def __init__(self):
        super().__init__('imu_reader')

        # Create subscription to IMU data
        self.subscription = self.create_subscription(
            Imu,
            'imu/data',
            self.imu_callback,
            10
        )

        # Create publisher for filtered orientation
        self.orientation_pub = self.create_publisher(
            Float64,
            'filtered_orientation',
            10
        )

        # IMU data storage
        self.orientation = {'x': 0.0, 'y': 0.0, 'z': 0.0, 'w': 1.0}
        self.angular_velocity = {'x': 0.0, 'y': 0.0, 'z': 0.0}
        self.linear_acceleration = {'x': 0.0, 'y': 0.0, 'z': 0.0}

        # Simple low-pass filter parameters
        self.filter_alpha = 0.1
        self.prev_yaw = 0.0

        self.get_logger().info('IMU Reader Node Started')

    def imu_callback(self, msg):
        """
        Process incoming IMU data and publish filtered orientation
        """
        # Store IMU data
        self.orientation['x'] = msg.orientation.x
        self.orientation['y'] = msg.orientation.y
        self.orientation['z'] = msg.orientation.z
        self.orientation['w'] = msg.orientation.w

        self.angular_velocity['x'] = msg.angular_velocity.x
        self.angular_velocity['y'] = msg.angular_velocity.y
        self.angular_velocity['z'] = msg.angular_velocity.z

        self.linear_acceleration['x'] = msg.linear_acceleration.x
        self.linear_acceleration['y'] = msg.linear_acceleration.y
        self.linear_acceleration['z'] = msg.linear_acceleration.z

        # Convert quaternion to yaw angle
        yaw = self.quaternion_to_yaw(
            msg.orientation.x,
            msg.orientation.y,
            msg.orientation.z,
            msg.orientation.w
        )

        # Apply simple low-pass filter
        filtered_yaw = self.filter_alpha * yaw + (1.0 - self.filter_alpha) * self.prev_yaw
        self.prev_yaw = filtered_yaw

        # Publish filtered orientation
        yaw_msg = Float64()
        yaw_msg.data = filtered_yaw
        self.orientation_pub.publish(yaw_msg)

        self.get_logger().debug(f'Yaw: {math.degrees(filtered_yaw):.2f}°')

    def quaternion_to_yaw(self, x, y, z, w):
        """
        Convert quaternion to yaw angle (in radians)
        """
        # Convert quaternion to Euler angles (roll, pitch, yaw)
        # For yaw calculation: yaw = atan2(2*(w*z + x*y), 1 - 2*(y^2 + z^2))
        yaw = math.atan2(
            2.0 * (w * z + x * y),
            1.0 - 2.0 * (y * y + z * z)
        )
        return yaw


def main(args=None):
    rclpy.init(args=args)

    imu_reader = ImuReader()

    try:
        rclpy.spin(imu_reader)
    except KeyboardInterrupt:
        pass
    finally:
        imu_reader.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

## Camera Stream Node

### Python Implementation

```python
#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from cv_bridge import CvBridge
import cv2
import numpy as np


class CameraStream(Node):
    def __init__(self):
        super().__init__('camera_stream')

        # Create publisher for camera images
        self.publisher = self.create_publisher(
            Image,
            'camera/image_raw',
            10
        )

        # Create timer for periodic image publishing
        self.timer = self.create_timer(0.1, self.timer_callback)  # 10 Hz

        # Initialize OpenCV bridge
        self.cv_bridge = CvBridge()

        # Initialize camera (in simulation, we'll generate synthetic images)
        self.frame_id = 0

        self.get_logger().info('Camera Stream Node Started')

    def timer_callback(self):
        """
        Generate and publish synthetic camera image
        """
        # In a real implementation, this would capture from a camera
        # For simulation, we generate a synthetic image
        height, width = 480, 640
        image = np.zeros((height, width, 3), dtype=np.uint8)

        # Draw some synthetic features (e.g., a circle and lines)
        cv2.circle(image, (width//2, height//2), 50, (255, 0, 0), -1)  # Blue circle
        cv2.line(image, (0, height//2), (width, height//2), (0, 255, 0), 2)  # Green horizontal line
        cv2.line(image, (width//2, 0), (width//2, height), (0, 255, 0), 2)  # Green vertical line

        # Add frame number as text
        cv2.putText(image, f'Frame: {self.frame_id}', (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

        # Convert OpenCV image to ROS Image message
        ros_image = self.cv_bridge.cv2_to_imgmsg(image, encoding='bgr8')
        ros_image.header.stamp = self.get_clock().now().to_msg()
        ros_image.header.frame_id = f'camera_frame_{self.frame_id}'

        # Publish the image
        self.publisher.publish(ros_image)

        self.frame_id += 1
        self.get_logger().debug(f'Published camera frame {self.frame_id}')


def main(args=None):
    rclpy.init(args=args)

    camera_stream = CameraStream()

    try:
        rclpy.spin(camera_stream)
    except KeyboardInterrupt:
        pass
    finally:
        camera_stream.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

## LiDAR Scan Node

### Python Implementation

```python
#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
import math
import numpy as np


class LidarScan(Node):
    def __init__(self):
        super().__init__('lidar_scan')

        # Create publisher for LiDAR scan data
        self.publisher = self.create_publisher(
            LaserScan,
            'lidar_scan',
            10
        )

        # Create timer for periodic LiDAR data publishing
        self.timer = self.create_timer(0.05, self.timer_callback)  # 20 Hz

        # LiDAR parameters
        self.angle_min = -math.pi / 2  # -90 degrees
        self.angle_max = math.pi / 2   # 90 degrees
        self.angle_increment = math.pi / 180  # 1 degree
        self.scan_time = 0.05  # seconds
        self.range_min = 0.1  # meters
        self.range_max = 10.0  # meters

        # Calculate number of points
        self.num_points = int((self.angle_max - self.angle_min) / self.angle_increment) + 1

        self.get_logger().info('LiDAR Scan Node Started')

    def timer_callback(self):
        """
        Generate and publish synthetic LiDAR scan data
        """
        # Create LaserScan message
        scan_msg = LaserScan()

        # Set header
        scan_msg.header.stamp = self.get_clock().now().to_msg()
        scan_msg.header.frame_id = 'lidar_frame'

        # Set LiDAR parameters
        scan_msg.angle_min = self.angle_min
        scan_msg.angle_max = self.angle_max
        scan_msg.angle_increment = self.angle_increment
        scan_msg.time_increment = 0.0
        scan_msg.scan_time = self.scan_time
        scan_msg.range_min = self.range_min
        scan_msg.range_max = self.range_max

        # Generate synthetic range data
        # In a real implementation, this would come from actual LiDAR sensor
        # For simulation, we create synthetic data with some obstacles
        ranges = []

        for i in range(self.num_points):
            angle = self.angle_min + i * self.angle_increment

            # Create synthetic environment with "walls" at certain angles
            if -0.2 < angle < 0.2:  # Front obstacle
                distance = 2.0 + 0.5 * math.sin(i * 0.2)  # Add some noise
            elif angle < -0.5:  # Left side
                distance = 5.0 + 0.3 * math.sin(i * 0.1)
            elif angle > 0.5:  # Right side
                distance = 4.0 + 0.4 * math.cos(i * 0.15)
            else:  # General environment
                distance = 3.0 + 1.0 * math.sin(i * 0.3)  # Varying distances

            # Add some random noise to simulate real sensor
            noise = np.random.normal(0, 0.05)
            distance_with_noise = max(self.range_min, min(self.range_max, distance + noise))

            ranges.append(distance_with_noise)

        scan_msg.ranges = ranges
        scan_msg.intensities = [100.0] * len(ranges)  # Constant intensity

        # Publish the scan
        self.publisher.publish(scan_msg)

        self.get_logger().debug(f'Published LiDAR scan with {len(ranges)} points')


def main(args=None):
    rclpy.init(args=args)

    lidar_scan = LidarScan()

    try:
        rclpy.spin(lidar_scan)
    except KeyboardInterrupt:
        pass
    finally:
        lidar_scan.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

## Launch File Structure

### Combined Launch File
Create `ros2_ws/launch/robot_nodes.launch.py`:

```python
import os
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, RegisterEventHandler
from launch.event_handlers import OnProcessStart
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare


def generate_launch_description():
    # Launch configuration variables
    use_sim_time = LaunchConfiguration('use_sim_time', default='true')

    # Declare launch arguments
    declare_use_sim_time_cmd = DeclareLaunchArgument(
        'use_sim_time',
        default_value='true',
        description='Use simulation (Gazebo) clock if true'
    )

    # Motor controller node
    motor_controller = Node(
        package='robot_control',
        executable='motor_controller',
        name='motor_controller',
        parameters=[{'use_sim_time': use_sim_time}],
        output='screen'
    )

    # IMU reader node
    imu_reader = Node(
        package='robot_control',
        executable='imu_reader',
        name='imu_reader',
        parameters=[{'use_sim_time': use_sim_time}],
        output='screen'
    )

    # Camera stream node
    camera_stream = Node(
        package='robot_control',
        executable='camera_stream',
        name='camera_stream',
        parameters=[{'use_sim_time': use_sim_time}],
        output='screen'
    )

    # LiDAR scan node
    lidar_scan = Node(
        package='robot_control',
        executable='lidar_scan',
        name='lidar_scan',
        parameters=[{'use_sim_time': use_sim_time}],
        output='screen'
    )

    # Create the launch description and populate
    ld = LaunchDescription()

    # Declare launch options
    ld.add_action(declare_use_sim_time_cmd)

    # Add nodes to launch
    ld.add_action(motor_controller)
    ld.add_action(imu_reader)
    ld.add_action(camera_stream)
    ld.add_action(lidar_scan)

    return ld
```

## Running the Nodes

### Build and Run Individual Nodes

```bash
# Build the workspace
cd ros2_ws
source /opt/ros/humble/setup.bash
colcon build --packages-select robot_control
source install/setup.bash

# Run individual nodes
ros2 run robot_control motor_controller
ros2 run robot_control imu_reader
ros2 run robot_control camera_stream
ros2 run robot_control lidar_scan

# Or run all nodes using launch file
ros2 launch robot_control robot_nodes.launch.py
```

### Testing Node Communication

```bash
# Check active nodes
ros2 node list

# Check topics
ros2 topic list

# Echo sensor data
ros2 topic echo /lidar_scan sensor_msgs/msg/LaserScan
ros2 topic echo /imu/data sensor_msgs/msg/Imu
ros2 topic echo /camera/image_raw sensor_msgs/msg/Image

# Send velocity commands
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist '{linear: {x: 1.0}, angular: {z: 0.5}}'
```