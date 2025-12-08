# Module 3: AI-Robot Brain (NVIDIA Isaac™)
## Topic 3: VSLAM and Navigation

### Overview
This topic implements the VSLAM and navigation system as documented in ADR-004: VSLAM Navigation Architecture. Students will learn to implement VSLAM algorithms that enable robots to build maps of their environment while simultaneously localizing themselves within those maps with &lt;5% drift as specified in the ADR, followed by path planning and navigation execution using Nav2 for humanoid robots.

### Learning Objectives
By the end of this topic, students will be able to:
1. Understand VSLAM principles and implementation (aligned with ADR-004)
2. Implement VSLAM systems using visual features
3. Create path planning algorithms for humanoid robots
4. Integrate navigation with obstacle avoidance
5. Validate navigation performance with drift metrics against ADR requirements (&lt;5% drift)

### Prerequisites
- Completion of Topics 1 and 2 in Module 3
- Understanding of ROS 2 navigation stack (Nav2)
- Basic knowledge of computer vision and feature detection
- Experience with Isaac ROS perception nodes

### 1. VSLAM Fundamentals

#### VSLAM Architecture
Visual SLAM systems typically follow a pipeline architecture:

```
VSLAM Pipeline
├── Image Acquisition
│   ├── Camera calibration
│   ├── Image rectification
│   └── Synchronization
├── Feature Detection & Matching
│   ├── ORB, SIFT, or FAST feature detection
│   ├── Feature descriptor computation
│   └── Feature matching across frames
├── Pose Estimation
│   ├── Essential matrix computation
│   ├── RANSAC-based outlier rejection
│   └── Camera pose optimization
├── Mapping
│   ├── 3D point cloud generation
│   ├── Map representation (grid, feature-based)
│   └── Map refinement
├── Optimization
│   ├── Bundle adjustment
│   ├── Loop closure detection
│   └── Graph optimization
└── Localization
    ├── Pose tracking
    ├── Map-based localization
    └── Failure recovery
```

#### VSLAM Node Implementation
```python
# vslam_node.py
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image, CameraInfo
from geometry_msgs.msg import PoseStamped, PointStamped
from nav_msgs.msg import Odometry
from visualization_msgs.msg import MarkerArray
import numpy as np
import cv2
from cv_bridge import CvBridge
import open3d as o3d
from scipy.spatial.transform import Rotation as R
import torch

class VSLAMNode(Node):
    def __init__(self):
        super().__init__('vslam_node')

        # Initialize CV bridge
        self.bridge = CvBridge()

        # Initialize feature detector
        self.detector = cv2.ORB_create(nfeatures=1000)
        self.matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)

        # Initialize pose estimation
        self.current_pose = np.eye(4)  # 4x4 transformation matrix
        self.previous_image = None
        self.previous_features = None
        self.map_points = []  # 3D map points
        self.keyframes = []   # Keyframe poses

        # Publishers
        self.pose_publisher = self.create_publisher(PoseStamped, '/navigation/vslam/pose', 10)
        self.odom_publisher = self.create_publisher(Odometry, '/vslam/odometry', 10)
        self.map_publisher = self.create_publisher(MarkerArray, '/vslam/map', 10)

        # Subscribers
        self.image_subscriber = self.create_subscription(
            Image,
            '/camera/image_raw',
            self.image_callback,
            10
        )

        self.camera_info_subscriber = self.create_subscription(
            CameraInfo,
            '/camera/camera_info',
            self.camera_info_callback,
            10
        )

        # Camera parameters
        self.camera_matrix = None
        self.dist_coeffs = None

        # Feature tracking parameters
        self.min_matches = 10
        self.max_features = 1000

        self.get_logger().info('VSLAM Node initialized')

    def camera_info_callback(self, msg):
        """Process camera calibration information"""
        self.camera_matrix = np.array(msg.k).reshape(3, 3)
        self.dist_coeffs = np.array(msg.d)

    def image_callback(self, msg):
        """Process incoming image for VSLAM"""
        if self.camera_matrix is None:
            return

        # Convert ROS image to OpenCV
        cv_image = self.bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')

        # Process image for VSLAM
        success = self.process_frame(cv_image)

        if success:
            # Publish current pose
            self.publish_pose(msg.header)
            self.publish_odometry(msg.header)

    def process_frame(self, current_image):
        """Process a single frame for VSLAM"""
        # Detect features in current image
        current_features = self.detect_features(current_image)

        if self.previous_image is not None and self.previous_features is not None:
            # Match features between previous and current frames
            matches = self.match_features(
                self.previous_features[1],
                current_features[1]
            )

            if len(matches) >= self.min_matches:
                # Estimate pose transformation
                transformation = self.estimate_pose(
                    self.previous_features[0],
                    current_features[0],
                    matches
                )

                if transformation is not None:
                    # Update current pose
                    self.current_pose = self.current_pose @ transformation
                    self.publish_pose()

                    # Add keyframe if significant movement occurred
                    if self.should_add_keyframe():
                        self.add_keyframe(current_image, current_features)

                    # Update for next iteration
                    self.previous_image = current_image
                    self.previous_features = current_features
                    return True

        # Initialize or update for next iteration
        self.previous_image = current_image
        self.previous_features = current_features
        return False

    def detect_features(self, image):
        """Detect features in image"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        keypoints = self.detector.detect(gray, None)

        if len(keypoints) > 0:
            keypoints, descriptors = self.detector.compute(gray, keypoints)
            # Extract keypoint locations
            locations = np.array([kp.pt for kp in keypoints])
            return locations, descriptors

        return np.array([]), np.array([])

    def match_features(self, desc1, desc2):
        """Match features between two sets of descriptors"""
        if desc1 is None or desc2 is None or len(desc1) == 0 or len(desc2) == 0:
            return []

        matches = self.matcher.knnMatch(desc1, desc2, k=2)

        # Apply Lowe's ratio test
        good_matches = []
        for match_pair in matches:
            if len(match_pair) == 2:
                m, n = match_pair
                if m.distance < 0.75 * n.distance:
                    good_matches.append(m)

        return good_matches

    def estimate_pose(self, prev_points, curr_points, matches):
        """Estimate pose transformation using matched points"""
        if len(matches) < self.min_matches:
            return None

        # Extract matched points
        prev_matched = np.float32([prev_points[m.queryIdx] for m in matches])
        curr_matched = np.float32([curr_points[m.trainIdx] for m in matches])

        # Estimate essential matrix
        E, mask = cv2.findEssentialMat(
            curr_matched, prev_matched,
            self.camera_matrix,
            method=cv2.RANSAC,
            threshold=1.0
        )

        if E is None or E.size == 0:
            return None

        # Decompose essential matrix to get rotation and translation
        _, R, t, _ = cv2.recoverPose(E, curr_matched, prev_matched, self.camera_matrix)

        # Create transformation matrix
        transformation = np.eye(4)
        transformation[:3, :3] = R
        transformation[:3, 3] = t.flatten()

        return transformation

    def should_add_keyframe(self):
        """Determine if a new keyframe should be added"""
        if len(self.keyframes) == 0:
            return True

        # Calculate distance to last keyframe
        last_pose = self.keyframes[-1]
        current_pos = self.current_pose[:3, 3]
        last_pos = last_pose[:3, 3]

        distance = np.linalg.norm(current_pos - last_pos)

        # Add keyframe if moved more than threshold
        return distance > 0.5  # 0.5 meters

    def add_keyframe(self, image, features):
        """Add current frame as a keyframe"""
        self.keyframes.append(self.current_pose.copy())

    def publish_pose(self, header=None):
        """Publish current estimated pose"""
        if header is None:
            header = self.get_clock().now().to_msg()

        pose_msg = PoseStamped()
        pose_msg.header.stamp = header
        pose_msg.header.frame_id = 'map'

        # Extract position and orientation
        position = self.current_pose[:3, 3]
        rotation_matrix = self.current_pose[:3, :3]
        rotation = R.from_matrix(rotation_matrix)
        quaternion = rotation.as_quat()

        pose_msg.pose.position.x = float(position[0])
        pose_msg.pose.position.y = float(position[1])
        pose_msg.pose.position.z = float(position[2])

        pose_msg.pose.orientation.x = float(quaternion[0])
        pose_msg.pose.orientation.y = float(quaternion[1])
        pose_msg.pose.orientation.z = float(quaternion[2])
        pose_msg.pose.orientation.w = float(quaternion[3])

        self.pose_publisher.publish(pose_msg)

    def publish_odometry(self, header):
        """Publish odometry information"""
        odom_msg = Odometry()
        odom_msg.header = header
        odom_msg.header.frame_id = 'map'
        odom_msg.child_frame_id = 'base_link'

        # Set position and orientation (same as pose)
        position = self.current_pose[:3, 3]
        rotation_matrix = self.current_pose[:3, :3]
        rotation = R.from_matrix(rotation_matrix)
        quaternion = rotation.as_quat()

        odom_msg.pose.pose.position.x = float(position[0])
        odom_msg.pose.pose.position.y = float(position[1])
        odom_msg.pose.pose.position.z = float(position[2])

        odom_msg.pose.pose.orientation.x = float(quaternion[0])
        odom_msg.pose.pose.orientation.y = float(quaternion[1])
        odom_msg.pose.pose.orientation.z = float(quaternion[2])
        odom_msg.pose.pose.orientation.w = float(quaternion[3])

        self.odom_publisher.publish(odom_msg)

class VSLAMMapManager:
    def __init__(self):
        self.map_points = []
        self.keyframes = []
        self.local_map = {}  # For local mapping
        self.global_map = {} # For global mapping

    def add_map_point(self, point_3d, descriptor):
        """Add a 3D point to the map"""
        map_point = {
            'position': point_3d,
            'descriptor': descriptor,
            'observations': [],  # List of (keyframe_id, feature_index)
            'id': len(self.map_points)
        }
        self.map_points.append(map_point)

    def update_map(self, keyframe_pose, features, descriptors):
        """Update map with new keyframe information"""
        keyframe_id = len(self.keyframes)
        self.keyframes.append({
            'pose': keyframe_pose,
            'features': features,
            'descriptors': descriptors,
            'id': keyframe_id
        })

    def optimize_map(self):
        """Perform bundle adjustment to optimize map"""
        # This would implement graph optimization or bundle adjustment
        pass

    def get_local_map(self, position, radius=5.0):
        """Get local map around current position"""
        local_points = []
        for point in self.map_points:
            distance = np.linalg.norm(point['position'][:2] - position[:2])
            if distance <= radius:
                local_points.append(point)
        return local_points
```

### 2. Path Planning Service

#### Path Planning Architecture
```python
# path_planning_service.py
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import PoseStamped, PoseWithCovarianceStamped
from nav_msgs.msg import Path, OccupancyGrid
from visualization_msgs.msg import Marker, MarkerArray
from std_srvs.srv import Trigger
from nav2_msgs.srv import ComputePathToPose
import numpy as np
import heapq
from typing import List, Tuple, Optional

class PathPlanningService(Node):
    def __init__(self):
        super().__init__('path_planning_service')

        # Service for computing paths
        self.compute_path_service = self.create_service(
            ComputePathToPose,
            '/navigation/compute_path',
            self.compute_path_callback
        )

        # Publishers
        self.path_publisher = self.create_publisher(Path, '/navigation/plan', 10)
        self.map_subscriber = self.create_subscription(
            OccupancyGrid,
            '/map',
            self.map_callback,
            10
        )

        # Internal state
        self.map_data = None
        self.map_resolution = None
        self.map_origin = None

        # Path planning parameters
        self.planning_frequency = 1.0  # Hz
        self.max_planning_time = 5.0   # seconds

        self.get_logger().info('Path Planning Service initialized')

    def map_callback(self, msg):
        """Update internal map representation"""
        self.map_data = np.array(msg.data).reshape(msg.info.height, msg.info.width)
        self.map_resolution = msg.info.resolution
        self.map_origin = (msg.info.origin.position.x, msg.info.origin.position.y)

    def compute_path_callback(self, request, response):
        """Compute path from start to goal pose"""
        start_pose = request.start
        goal_pose = request.goal.pose

        if self.map_data is None:
            self.get_logger().warn('No map data available for path planning')
            response.error_code = 1  # FAILURE
            response.error_message = 'No map data available'
            return response

        # Convert poses to map coordinates
        start_coords = self.pose_to_map_coords(start_pose)
        goal_coords = self.pose_to_map_coords(goal_pose)

        if not self.is_valid_coords(start_coords) or not self.is_valid_coords(goal_coords):
            response.error_code = 1  # FAILURE
            response.error_message = 'Start or goal pose outside map bounds'
            return response

        if self.is_occupied(start_coords) or self.is_occupied(goal_coords):
            response.error_code = 1  # FAILURE
            response.error_message = 'Start or goal pose in occupied space'
            return response

        # Plan path using A* algorithm
        path = self.plan_path_astar(start_coords, goal_coords)

        if path is None:
            response.error_code = 1  # FAILURE
            response.error_message = 'No valid path found'
            return response

        # Convert path to ROS Path message
        path_msg = self.create_path_message(path, request.goal.header)
        response.path = path_msg
        response.error_code = 0  # SUCCESS

        # Publish path for visualization
        self.path_publisher.publish(path_msg)

        return response

    def pose_to_map_coords(self, pose):
        """Convert pose to map coordinates (row, col)"""
        x = int((pose.position.x - self.map_origin[0]) / self.map_resolution)
        y = int((pose.position.y - self.map_origin[1]) / self.map_resolution)
        return (y, x)  # Note: y first for array indexing

    def map_coords_to_pose(self, coords):
        """Convert map coordinates to pose"""
        row, col = coords
        x = col * self.map_resolution + self.map_origin[0]
        y = row * self.map_resolution + self.map_origin[1]

        pose = PoseStamped()
        pose.pose.position.x = x
        pose.pose.position.y = y
        return pose

    def is_valid_coords(self, coords):
        """Check if coordinates are within map bounds"""
        row, col = coords
        return 0 <= row < self.map_data.shape[0] and 0 <= col < self.map_data.shape[1]

    def is_occupied(self, coords):
        """Check if coordinates are occupied (value > 50 on occupancy grid)"""
        row, col = coords
        if not self.is_valid_coords(coords):
            return True
        return self.map_data[row, col] > 50

    def plan_path_astar(self, start, goal):
        """Plan path using A* algorithm"""
        # Heuristic function (Manhattan distance)
        def heuristic(a, b):
            return abs(a[0] - b[0]) + abs(a[1] - b[1])

        # Priority queue: (f_score, g_score, position)
        open_set = [(0, 0, start)]
        came_from = {}
        g_score = {start: 0}
        f_score = {start: heuristic(start, goal)}

        # Visited set
        closed_set = set()

        # 8-connected neighborhood
        neighbors = [
            (-1, -1), (-1, 0), (-1, 1),
            (0, -1),           (0, 1),
            (1, -1),  (1, 0),  (1, 1)
        ]

        while open_set:
            current = heapq.heappop(open_set)[2]

            if current == goal:
                # Reconstruct path
                path = []
                while current in came_from:
                    path.append(current)
                    current = came_from[current]
                path.append(start)
                return path[::-1]  # Reverse to get start->goal

            if current in closed_set:
                continue

            closed_set.add(current)

            for dr, dc in neighbors:
                neighbor = (current[0] + dr, current[1] + dc)

                if not self.is_valid_coords(neighbor) or self.is_occupied(neighbor):
                    continue

                # Calculate tentative g_score
                move_cost = np.sqrt(dr**2 + dc**2)  # Euclidean distance
                tentative_g_score = g_score.get(current, float('inf')) + move_cost

                if tentative_g_score < g_score.get(neighbor, float('inf')):
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g_score
                    f_score[neighbor] = tentative_g_score + heuristic(neighbor, goal)
                    heapq.heappush(open_set, (f_score[neighbor], g_score[neighbor], neighbor))

        return None  # No path found

    def create_path_message(self, path_coords, header):
        """Create ROS Path message from path coordinates"""
        path_msg = Path()
        path_msg.header = header

        for coords in path_coords:
            pose_stamped = PoseStamped()
            pose_stamped.header = header
            pose = self.map_coords_to_pose(coords)
            pose_stamped.pose = pose.pose
            path_msg.poses.append(pose_stamped)

        return path_msg
```

### 3. Navigation Control Service

#### Navigation Control Implementation
```python
# navigation_control.py
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import PoseStamped, Twist
from nav_msgs.msg import Odometry
from action_msgs.msg import GoalStatus
from nav2_msgs.action import NavigateToPose
from std_msgs.msg import Float64
import numpy as np
import math
from typing import Tuple

class NavigationControl(Node):
    def __init__(self):
        super().__init__('navigation_control')

        # Action server for navigation
        self.navigation_action_server = self.create_action_server(
            NavigateToPose,
            '/navigation/move_to_pose',
            self.execute_navigation_callback,
            goal_callback=self.goal_accept_callback,
            cancel_callback=self.cancel_callback
        )

        # Publishers and subscribers
        self.cmd_vel_publisher = self.create_publisher(Twist, '/cmd_vel', 10)
        self.odom_subscriber = self.create_subscription(
            Odometry,
            '/odom',
            self.odom_callback,
            10
        )

        # Internal state
        self.current_pose = None
        self.current_velocity = None
        self.goal_pose = None
        self.navigation_active = False

        # Navigation parameters
        self.linear_speed = 0.5  # m/s
        self.angular_speed = 0.5  # rad/s
        self.linear_tolerance = 0.1  # meters
        self.angular_tolerance = 0.1  # radians
        self.max_linear_speed = 1.0
        self.max_angular_speed = 1.0

        self.get_logger().info('Navigation Control initialized')

    def goal_accept_callback(self, goal_request):
        """Callback to accept or reject navigation goal"""
        self.get_logger().info(f'Accepting navigation goal: {goal_request.pose.pose}')
        return self.navigation_action_server.accept_new_goal()

    def cancel_callback(self, goal_handle):
        """Callback when navigation goal is cancelled"""
        self.get_logger().info('Navigation goal cancelled')
        self.navigation_active = False
        return

    def execute_navigation_callback(self, goal_handle):
        """Execute navigation to goal pose"""
        self.navigation_active = True
        self.goal_pose = goal_request.pose

        feedback_msg = NavigateToPose.Feedback()
        result_msg = NavigateToPose.Result()

        while self.navigation_active and rclpy.ok():
            if goal_handle.is_cancel_requested:
                goal_handle.canceled()
                result_msg.error_code = NavigateToPose.Result.FAILURE
                return result_msg

            if self.current_pose is None:
                # Wait for odometry
                self.get_logger().info('Waiting for odometry...')
                time.sleep(0.1)
                continue

            # Calculate distance and angle to goal
            distance, angle_to_goal = self.calculate_distance_and_angle(
                self.current_pose,
                self.goal_pose.pose
            )

            # Check if reached goal
            if distance < self.linear_tolerance:
                self.get_logger().info('Reached navigation goal')
                self.stop_robot()
                goal_handle.succeed()
                result_msg.error_code = NavigateToPose.Result.SUCCESS
                return result_msg

            # Calculate control commands
            linear_vel, angular_vel = self.calculate_control(
                distance,
                angle_to_goal
            )

            # Publish velocity commands
            cmd_msg = Twist()
            cmd_msg.linear.x = min(linear_vel, self.max_linear_speed)
            cmd_msg.angular.z = min(angular_vel, self.max_angular_speed)
            self.cmd_vel_publisher.publish(cmd_msg)

            # Publish feedback
            feedback_msg.current_pose = self.current_pose
            feedback_msg.distance_remaining = distance
            goal_handle.publish_feedback(feedback_msg)

            # Sleep to maintain control frequency
            time.sleep(0.05)

        # If we exit the loop without success
        self.stop_robot()
        result_msg.error_code = NavigateToPose.Result.FAILURE
        goal_handle.abort()
        return result_msg

    def odom_callback(self, msg):
        """Update current pose from odometry"""
        self.current_pose = msg.pose.pose

    def calculate_distance_and_angle(self, current_pose, goal_pose):
        """Calculate distance and angle to goal pose"""
        dx = goal_pose.position.x - current_pose.position.x
        dy = goal_pose.position.y - current_pose.position.y
        distance = math.sqrt(dx**2 + dy**2)

        # Calculate angle to goal
        current_yaw = self.quaternion_to_yaw(current_pose.orientation)
        angle_to_goal = math.atan2(dy, dx)
        angle_diff = angle_to_goal - current_yaw

        # Normalize angle to [-pi, pi]
        while angle_diff > math.pi:
            angle_diff -= 2 * math.pi
        while angle_diff < -math.pi:
            angle_diff += 2 * math.pi

        return distance, angle_diff

    def calculate_control(self, distance, angle_to_goal):
        """Calculate linear and angular velocity commands"""
        # Proportional controller
        linear_vel = min(distance * 0.5, self.linear_speed)
        angular_vel = angle_to_goal * 1.0

        # Limit angular velocity to prevent spinning
        angular_vel = max(min(angular_vel, self.angular_speed), -self.angular_speed)

        return linear_vel, angular_vel

    def quaternion_to_yaw(self, quaternion):
        """Convert quaternion to yaw angle"""
        siny_cosp = 2 * (quaternion.w * quaternion.z + quaternion.x * quaternion.y)
        cosy_cosp = 1 - 2 * (quaternion.y * quaternion.y + quaternion.z * quaternion.z)
        return math.atan2(siny_cosp, cosy_cosp)

    def stop_robot(self):
        """Stop robot movement"""
        cmd_msg = Twist()
        cmd_msg.linear.x = 0.0
        cmd_msg.angular.z = 0.0
        self.cmd_vel_publisher.publish(cmd_msg)
```

### 4. Obstacle Detection and Avoidance

#### Obstacle Avoidance Implementation
```python
# obstacle_avoidance.py
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan, PointCloud2
from geometry_msgs.msg import Twist, PoseStamped
from visualization_msgs.msg import MarkerArray
import numpy as np
from typing import List, Tuple

class ObstacleAvoidance(Node):
    def __init__(self):
        super().__init__('obstacle_avoidance')

        # Publishers and subscribers
        self.cmd_vel_publisher = self.create_publisher(Twist, '/cmd_vel', 10)
        self.laser_subscriber = self.create_subscription(
            LaserScan,
            '/scan',
            self.laser_callback,
            10
        )

        self.vslam_pose_subscriber = self.create_subscription(
            PoseStamped,
            '/navigation/vslam/pose',
            self.vslam_pose_callback,
            10
        )

        # Internal state
        self.current_vslam_pose = None
        self.safe_distance = 0.5  # meters
        self.avoidance_active = False

        # Obstacle detection parameters
        self.min_obstacle_distance = 1.0  # meters
        self.detection_angle = 30  # degrees (half angle for front detection)

        self.get_logger().info('Obstacle Avoidance initialized')

    def laser_callback(self, msg):
        """Process laser scan data for obstacle detection"""
        # Get angles for front detection (within detection_angle)
        angle_min = msg.angle_min
        angle_increment = msg.angle_increment

        # Calculate indices for front detection
        start_angle = -np.radians(self.detection_angle)
        end_angle = np.radians(self.detection_angle)

        start_idx = int((start_angle - angle_min) / angle_increment)
        end_idx = int((end_angle - angle_min) / angle_increment)

        # Ensure indices are within bounds
        start_idx = max(0, start_idx)
        end_idx = min(len(msg.ranges), end_idx)

        # Get distances in front of robot
        front_distances = msg.ranges[start_idx:end_idx]
        front_distances = [d for d in front_distances if not (d != d or d > msg.range_max)]

        if front_distances:
            min_distance = min(front_distances)

            if min_distance < self.min_obstacle_distance:
                self.get_logger().info(f'Obstacle detected at {min_distance:.2f}m, activating avoidance')
                self.activate_avoidance(msg, min_distance)
            else:
                if self.avoidance_active:
                    self.get_logger().info('Path clear, resuming navigation')
                    self.avoidance_active = False

    def vslam_pose_callback(self, msg):
        """Update VSLAM pose"""
        self.current_vslam_pose = msg.pose

    def activate_avoidance(self, laser_msg, min_distance):
        """Activate obstacle avoidance behavior"""
        self.avoidance_active = True

        # Calculate obstacle positions in robot frame
        obstacles = self.get_obstacle_positions(laser_msg)

        # Generate avoidance command
        cmd_vel = self.generate_avoidance_command(obstacles, min_distance)

        # Publish command
        self.cmd_vel_publisher.publish(cmd_vel)

    def get_obstacle_positions(self, laser_msg):
        """Convert laser scan to obstacle positions in robot frame"""
        obstacles = []

        angle_min = laser_msg.angle_min
        angle_increment = laser_msg.angle_increment

        for i, range_val in enumerate(laser_msg.ranges):
            if range_val != range_val or range_val > laser_msg.range_max:
                continue  # Skip invalid ranges

            angle = angle_min + i * angle_increment
            x = range_val * np.cos(angle)
            y = range_val * np.sin(angle)
            obstacles.append((x, y))

        return obstacles

    def generate_avoidance_command(self, obstacles, min_distance):
        """Generate velocity command to avoid obstacles"""
        cmd_vel = Twist()

        if not obstacles:
            return cmd_vel

        # Simple reactive approach: turn away from closest obstacle
        closest_obstacle = min(obstacles, key=lambda o: np.sqrt(o[0]**2 + o[1]**2))
        obstacle_angle = np.arctan2(closest_obstacle[1], closest_obstacle[0])

        # If obstacle is in front, turn away
        if abs(obstacle_angle) < np.pi/4:  # Within 45 degrees of front
            if closest_obstacle[1] > 0:  # Obstacle on the right, turn left
                cmd_vel.angular.z = 0.5
            else:  # Obstacle on the left, turn right
                cmd_vel.angular.z = -0.5
        else:
            # If obstacle not directly in front, continue forward with slight adjustment
            cmd_vel.linear.x = 0.2
            cmd_vel.angular.z = -obstacle_angle * 0.5  # Turn away from obstacle angle

        return cmd_vel
```

### 5. Drift Metrics and Validation

#### Drift Calculation and Monitoring
```python
# drift_metrics.py
import numpy as np
from typing import List, Tuple, Dict
import math

class DriftMetrics:
    def __init__(self):
        self.ground_truth_positions = []  # Known positions (from simulation)
        self.estimated_positions = []     # Positions from VSLAM
        self.drift_history = []          # Historical drift values
        self.total_distance_traveled = 0.0
        self.max_drift = 0.0
        self.average_drift = 0.0

    def add_position_estimate(self, ground_truth: Tuple[float, float],
                            estimated: Tuple[float, float]):
        """Add a position estimate for drift calculation"""
        self.ground_truth_positions.append(ground_truth)
        self.estimated_positions.append(estimated)

        # Calculate drift for this position
        drift = self.calculate_drift(ground_truth, estimated)
        self.drift_history.append(drift)

        # Update metrics
        if len(self.ground_truth_positions) > 1:
            # Calculate distance traveled since last position
            last_gt = self.ground_truth_positions[-2]
            current_gt = self.ground_truth_positions[-1]
            distance = math.sqrt(
                (current_gt[0] - last_gt[0])**2 +
                (current_gt[1] - last_gt[1])**2
            )
            self.total_distance_traveled += distance

        self.max_drift = max(self.drift_history) if self.drift_history else 0.0
        self.average_drift = np.mean(self.drift_history) if self.drift_history else 0.0

    def calculate_drift(self, ground_truth: Tuple[float, float],
                       estimated: Tuple[float, float]) -> float:
        """Calculate drift between ground truth and estimated positions"""
        dx = ground_truth[0] - estimated[0]
        dy = ground_truth[1] - estimated[1]
        return math.sqrt(dx**2 + dy**2)

    def get_drift_percentage(self) -> float:
        """Calculate drift as percentage of total distance traveled"""
        if self.total_distance_traveled == 0:
            return 0.0
        return (self.average_drift / self.total_distance_traveled) * 100

    def is_within_acceptable_drift(self, max_percentage=5.0) -> bool:
        """Check if drift is within acceptable limits (5% by default)"""
        return self.get_drift_percentage() <= max_percentage

    def get_drift_report(self) -> Dict[str, float]:
        """Get comprehensive drift report"""
        return {
            'max_drift_m': self.max_drift,
            'average_drift_m': self.average_drift,
            'total_distance_m': self.total_distance_traveled,
            'drift_percentage': self.get_drift_percentage(),
            'is_acceptable': self.is_within_acceptable_drift(),
            'position_count': len(self.ground_truth_positions)
        }

class VSLAMDriftMonitor:
    def __init__(self):
        self.drift_metrics = DriftMetrics()
        self.ground_truth_subscriber = None
        self.estimated_pose_subscriber = None

    def register_ground_truth_callback(self, callback):
        """Register callback for ground truth positions"""
        self.ground_truth_callback = callback

    def register_estimated_callback(self, callback):
        """Register callback for estimated positions"""
        self.estimated_callback = callback

    def process_ground_truth(self, position):
        """Process ground truth position"""
        # Store for drift calculation when estimated position arrives
        self.last_ground_truth = position

    def process_estimated_pose(self, position):
        """Process estimated pose and calculate drift"""
        if hasattr(self, 'last_ground_truth'):
            self.drift_metrics.add_position_estimate(
                self.last_ground_truth,
                position
            )

    def get_performance_metrics(self):
        """Get comprehensive performance metrics"""
        drift_report = self.drift_metrics.get_drift_report()

        return {
            'drift_metrics': drift_report,
            'vslam_quality': self.assess_vslam_quality(drift_report),
            'recommendations': self.get_recommendations(drift_report)
        }

    def assess_vslam_quality(self, drift_report: Dict) -> str:
        """Assess VSLAM quality based on drift metrics"""
        if drift_report['drift_percentage'] <= 2.0:
            return 'Excellent'
        elif drift_report['drift_percentage'] <= 5.0:
            return 'Good'
        elif drift_report['drift_percentage'] <= 10.0:
            return 'Acceptable'
        else:
            return 'Poor - Requires calibration or algorithm improvement'

    def get_recommendations(self, drift_report: Dict) -> List[str]:
        """Get recommendations based on drift performance"""
        recommendations = []

        if drift_report['drift_percentage'] > 5.0:
            recommendations.append('Consider implementing loop closure detection')
            recommendations.append('Review camera calibration parameters')
            recommendations.append('Increase feature density for better tracking')

        if drift_report['max_drift_m'] > 1.0:
            recommendations.append('Implement pose graph optimization')
            recommendations.append('Consider using IMU data for sensor fusion')

        if len(drift_report) > 100:  # If we have enough data points
            recommendations.append('Perform bundle adjustment periodically')

        return recommendations
```

### 6. Debugging Tips

#### Common Issues and Solutions
1. **High Drift in VSLAM**:
   - Increase feature density
   - Implement loop closure detection
   - Use sensor fusion with IMU

2. **Path Planning Failures**:
   - Verify map quality and resolution
   - Check obstacle inflation parameters
   - Ensure proper coordinate frame transformations

3. **Navigation Instability**:
   - Tune PID controller parameters
   - Check odometry accuracy
   - Verify sensor data quality

#### Performance Debugging
```bash
# Monitor VSLAM performance
ros2 topic echo /navigation/vslam/pose

# Check path planning service
ros2 service call /navigation/compute_path nav2_msgs/srv/ComputePathToPose

# Monitor navigation performance
ros2 action goal /navigation/move_to_pose nav2_msgs/action/NavigateToPose

# Check drift metrics
ros2 run vslam_drift_monitor drift_analyzer
```

### Expected Output
When completing this topic, students should have:
- A functional VSLAM system with drift monitoring (aligned with ADR-004)
- Path planning service with A* algorithm
- Navigation control with obstacle avoidance
- Drift metrics showing &lt;5% drift over 100m paths (as specified in ADR-004)
- Validated navigation performance in simulation

### Next Steps
After completing this topic, students will be prepared to move to Module 4: Vision-Language-Action (VLA), where they will learn to integrate voice recognition and cognitive planning with their robotic systems.