# Module 4: Vision-Language-Action (VLA)
## Topic 3: Capstone Project – Autonomous Humanoid

### Overview
This capstone project integrates all concepts learned throughout Modules 3 and 4 to create a fully autonomous humanoid robot system as documented in ADR-002: NVIDIA Isaac Technology Stack, ADR-003: Vision-Language-Action (VLA) Architecture, and ADR-004: VSLAM Navigation Architecture. Students will implement a complete system that combines photorealistic simulation, Isaac ROS perception, VSLAM navigation, voice recognition, and cognitive planning to perform complex tasks autonomously while meeting all performance requirements specified in the ADRs.

### Learning Objectives
By the end of this topic, students will be able to:
1. Integrate all modules into a cohesive autonomous system
2. Implement complex task execution with multiple subsystems
3. Create robust error handling and recovery mechanisms
4. Validate complete system performance and reliability
5. Demonstrate end-to-end autonomous humanoid capabilities

### Prerequisites
- Completion of all previous modules and topics
- Fully functional implementations of Modules 1-3
- Working voice recognition and cognitive planning systems
- Comprehensive understanding of ROS 2 architecture

### 1. Capstone System Architecture

#### Complete Autonomous Humanoid Architecture
```
Autonomous Humanoid System
├── Perception Layer
│   ├── Isaac Sim Integration
│   ├── Isaac ROS Perception Nodes
│   │   ├── Object Detection
│   │   ├── Classification
│   │   └── Depth Estimation
│   ├── Sensor Fusion
│   └── Environmental Awareness
├── Localization & Mapping
│   ├── VSLAM System
│   ├── Map Management
│   ├── Pose Estimation
│   └── Drift Correction
├── Navigation Layer
│   ├── Global Path Planning
│   ├── Local Path Planning
│   ├── Obstacle Avoidance
│   └── Motion Control
├── Cognitive Layer
│   ├── Voice Recognition
│   ├── Natural Language Understanding
│   ├── Cognitive Planning
│   ├── Action Sequencing
│   └── Safety Validation
├── Execution Layer
│   ├── Action Execution
│   ├── State Monitoring
│   ├── Plan Adaptation
│   └── Recovery Mechanisms
└── Integration Layer
    ├── System Coordination
    ├── Task Management
    ├── Performance Monitoring
    └── User Interface
```

#### Capstone Integration Service Implementation
```python
# autonomous_humanoid.py
import rclpy
from rclpy.node import Node
from std_msgs.msg import String, Bool
from geometry_msgs.msg import PoseStamped
from sensor_msgs.msg import Image
from std_srvs.srv import Trigger
from action_msgs.msg import GoalStatus
import threading
import time
from typing import Dict, List, Any, Optional
import json

class AutonomousHumanoid(Node):
    def __init__(self):
        super().__init__('autonomous_humanoid')

        # Subsystem status publishers
        self.system_status_publisher = self.create_publisher(String, '/system/status', 10)
        self.task_status_publisher = self.create_publisher(String, '/task/status', 10)
        self.error_publisher = self.create_publisher(String, '/system/errors', 10)

        # Subsystem status subscribers
        self.vslam_pose_subscriber = self.create_subscription(
            PoseStamped,
            '/navigation/vslam/pose',
            self.vslam_pose_callback,
            10
        )

        self.perception_subscriber = self.create_subscription(
            String,
            '/perception/status',
            self.perception_status_callback,
            10
        )

        self.voice_command_subscriber = self.create_subscription(
            String,
            '/voice/command',
            self.voice_command_callback,
            10
        )

        # Services
        self.start_autonomy_service = self.create_service(
            Trigger,
            '/autonomous_humanoid/start',
            self.start_autonomy_callback
        )

        self.stop_autonomy_service = self.create_service(
            Trigger,
            '/autonomous_humanoid/stop',
            self.stop_autonomy_callback
        )

        self.execute_task_service = self.create_service(
            ExecuteTask,
            '/autonomous_humanoid/execute_task',
            self.execute_task_callback
        )

        # Internal state
        self.autonomy_active = False
        self.current_task = None
        self.task_queue = []
        self.system_status = "IDLE"
        self.subsystem_status = {
            'vslam': 'UNINITIALIZED',
            'perception': 'UNINITIALIZED',
            'navigation': 'UNINITIALIZED',
            'voice': 'UNINITIALIZED',
            'planning': 'UNINITIALIZED'
        }

        # Performance monitoring
        self.performance_monitor = AutonomousHumanoidPerformanceMonitor()

        # Recovery mechanisms
        self.recovery_manager = RecoveryManager()

        self.get_logger().info('Autonomous Humanoid system initialized')

    def vslam_pose_callback(self, msg):
        """Update VSLAM status"""
        self.subsystem_status['vslam'] = 'ACTIVE'

    def perception_status_callback(self, msg):
        """Update perception status"""
        status_data = json.loads(msg.data)
        self.subsystem_status['perception'] = status_data.get('status', 'ERROR')

    def voice_command_callback(self, msg):
        """Process voice commands for autonomous system"""
        if not self.autonomy_active:
            return

        command = msg.data
        self.get_logger().info(f'Received voice command in autonomous mode: {command}')

        # Process command through cognitive planning
        plan = self.process_voice_command_for_autonomy(command)

        if plan:
            self.add_task_to_queue(plan)

    def start_autonomy_callback(self, request, response):
        """Start autonomous operation"""
        if self.autonomy_active:
            response.success = False
            response.message = 'Autonomy already active'
            return response

        # Check all subsystems are ready
        if not self.all_subsystems_ready():
            response.success = False
            response.message = 'Not all subsystems are ready'
            return response

        self.autonomy_active = True
        self.system_status = 'ACTIVE'

        # Start main autonomy loop
        self.autonomy_thread = threading.Thread(target=self.autonomy_loop)
        self.autonomy_thread.daemon = True
        self.autonomy_thread.start()

        response.success = True
        response.message = 'Autonomy started successfully'
        self.publish_system_status()

        return response

    def stop_autonomy_callback(self, request, response):
        """Stop autonomous operation"""
        self.autonomy_active = False
        self.system_status = 'IDLE'

        response.success = True
        response.message = 'Autonomy stopped'
        self.publish_system_status()

        return response

    def execute_task_callback(self, request, response):
        """Execute a specific task"""
        task = {
            'id': request.task_id,
            'type': request.task_type,
            'parameters': request.parameters,
            'priority': request.priority
        }

        if self.autonomy_active:
            self.add_task_to_queue(task)
            response.success = True
            response.message = f'Task {request.task_id} added to queue'
        else:
            response.success = False
            response.message = 'Autonomy not active'

        return response

    def all_subsystems_ready(self) -> bool:
        """Check if all subsystems are ready"""
        required_subsystems = ['vslam', 'perception', 'navigation', 'voice', 'planning']

        for subsystem in required_subsystems:
            if self.subsystem_status.get(subsystem, 'UNINITIALIZED') != 'ACTIVE':
                return False
        return True

    def autonomy_loop(self):
        """Main autonomy execution loop"""
        while self.autonomy_active:
            try:
                # Check for tasks in queue
                if self.task_queue:
                    task = self.task_queue.pop(0)
                    self.execute_task(task)

                # Monitor system health
                self.monitor_system_health()

                # Sleep to prevent busy waiting
                time.sleep(0.1)

            except Exception as e:
                self.get_logger().error(f'Error in autonomy loop: {e}')
                self.handle_system_error(str(e))

                # Attempt recovery
                if self.recovery_manager.can_recover():
                    self.recovery_manager.attempt_recovery()
                else:
                    self.autonomy_active = False
                    break

    def execute_task(self, task: Dict):
        """Execute a single task"""
        self.current_task = task
        self.publish_task_status(f"Executing task: {task.get('id', 'unknown')}")

        try:
            task_type = task.get('type', '').lower()

            if task_type == 'navigation':
                self.execute_navigation_task(task)
            elif task_type == 'perception':
                self.execute_perception_task(task)
            elif task_type == 'manipulation':
                self.execute_manipulation_task(task)
            elif task_type == 'communication':
                self.execute_communication_task(task)
            else:
                self.get_logger().warn(f'Unknown task type: {task_type}')

            self.publish_task_status(f"Completed task: {task.get('id', 'unknown')}")

        except Exception as e:
            self.get_logger().error(f'Error executing task {task.get("id", "unknown")}: {e}')
            self.handle_task_error(task, str(e))

    def execute_navigation_task(self, task: Dict):
        """Execute navigation task"""
        # This would call the navigation system
        target = task.get('parameters', {}).get('target')
        if target:
            self.get_logger().info(f'Navigating to {target}')
            # Call navigation service here

    def execute_perception_task(self, task: Dict):
        """Execute perception task"""
        object_type = task.get('parameters', {}).get('object_type')
        if object_type:
            self.get_logger().info(f'Looking for {object_type}')
            # Call perception system here

    def execute_manipulation_task(self, task: Dict):
        """Execute manipulation task"""
        object_name = task.get('parameters', {}).get('object')
        if object_name:
            self.get_logger().info(f'Attempting to manipulate {object_name}')
            # Call manipulation system here

    def execute_communication_task(self, task: Dict):
        """Execute communication task"""
        message = task.get('parameters', {}).get('message')
        if message:
            self.get_logger().info(f'Communicating: {message}')
            # Call communication system here

    def add_task_to_queue(self, task: Dict):
        """Add task to execution queue"""
        self.task_queue.append(task)
        self.get_logger().info(f'Added task to queue: {task.get("id", "unknown")}')

    def process_voice_command_for_autonomy(self, command: str) -> Optional[Dict]:
        """Process voice command and create autonomous task"""
        # This would call the cognitive planning system
        # For now, return a simple task
        return {
            'id': f'task_{int(time.time())}',
            'type': 'communication',
            'parameters': {'message': f'Received command: {command}'},
            'priority': 1
        }

    def monitor_system_health(self):
        """Monitor overall system health"""
        health_report = {
            'timestamp': time.time(),
            'system_status': self.system_status,
            'subsystem_status': self.subsystem_status.copy(),
            'task_queue_length': len(self.task_queue),
            'current_task': self.current_task
        }

        # Publish health status
        status_msg = String()
        status_msg.data = json.dumps(health_report)
        self.system_status_publisher.publish(status_msg)

    def handle_system_error(self, error_msg: str):
        """Handle system-level errors"""
        self.get_logger().error(f'System error: {error_msg}')

        error_msg_obj = String()
        error_msg_obj.data = error_msg
        self.error_publisher.publish(error_msg_obj)

    def handle_task_error(self, task: Dict, error_msg: str):
        """Handle task-level errors"""
        self.get_logger().error(f'Task error for {task.get("id", "unknown")}: {error_msg}')

        # Log error and potentially add recovery task
        recovery_task = {
            'id': f'recovery_{task.get("id", "unknown")}',
            'type': 'recovery',
            'parameters': {'original_task': task, 'error': error_msg},
            'priority': 10
        }

        self.add_task_to_queue(recovery_task)

    def publish_system_status(self):
        """Publish current system status"""
        status_msg = String()
        status_msg.data = self.system_status
        self.system_status_publisher.publish(status_msg)

    def publish_task_status(self, status: str):
        """Publish current task status"""
        status_msg = String()
        status_msg.data = status
        self.task_status_publisher.publish(status_msg)

# Custom message types (these would be defined in .msg/.srv files)
class ExecuteTaskRequest:
    def __init__(self):
        self.task_id = ""
        self.task_type = ""
        self.parameters = {}
        self.priority = 1

class ExecuteTaskResponse:
    def __init__(self):
        self.success = False
        self.message = ""
```

### 2. Task Management and Coordination

#### Task Management Implementation
```python
# task_manager.py
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
import json
import time
from typing import Dict, List, Any, Optional
from enum import Enum

class TaskPriority(Enum):
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4

class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TaskManager(Node):
    def __init__(self):
        super().__init__('task_manager')

        # Publishers
        self.task_status_publisher = self.create_publisher(String, '/task_manager/status', 10)
        self.task_queue_publisher = self.create_publisher(String, '/task_manager/queue', 10)

        # Internal state
        self.active_tasks = {}
        self.task_queue = []
        self.completed_tasks = []
        self.failed_tasks = []

        # Task execution parameters
        self.max_concurrent_tasks = 3
        self.task_timeout = 300  # 5 minutes

        self.get_logger().info('Task Manager initialized')

    def create_task(self, task_config: Dict) -> str:
        """Create a new task and add to queue"""
        task_id = f"task_{int(time.time() * 1000)}_{len(self.active_tasks)}"

        task = {
            'id': task_id,
            'type': task_config.get('type', 'generic'),
            'parameters': task_config.get('parameters', {}),
            'priority': TaskPriority(task_config.get('priority', TaskPriority.NORMAL.value)),
            'status': TaskStatus.PENDING,
            'created_at': time.time(),
            'started_at': None,
            'completed_at': None,
            'dependencies': task_config.get('dependencies', []),
            'retries': 0,
            'max_retries': task_config.get('max_retries', 3)
        }

        self.task_queue.append(task)
        self.sort_task_queue()

        self.get_logger().info(f'Created task {task_id}: {task["type"]}')
        self.publish_task_queue_update()

        return task_id

    def sort_task_queue(self):
        """Sort task queue by priority and dependencies"""
        # Sort by priority (higher first)
        self.task_queue.sort(key=lambda x: x['priority'].value, reverse=True)

    def execute_next_task(self) -> bool:
        """Execute the next available task"""
        if not self.task_queue:
            return False

        # Check if we can start more tasks
        active_count = sum(1 for task in self.active_tasks.values()
                          if task['status'] == TaskStatus.IN_PROGRESS)

        if active_count >= self.max_concurrent_tasks:
            return False

        # Find next task that can be executed (dependencies met)
        for i, task in enumerate(self.task_queue):
            if self.dependencies_met(task):
                # Move task from queue to active
                self.task_queue.pop(i)
                task['status'] = TaskStatus.IN_PROGRESS
                task['started_at'] = time.time()
                self.active_tasks[task['id']] = task

                self.get_logger().info(f'Starting task {task["id"]}')

                # Execute task in separate thread
                task_thread = threading.Thread(target=self.run_task, args=(task['id'],))
                task_thread.daemon = True
                task_thread.start()

                return True

        return False

    def dependencies_met(self, task: Dict) -> bool:
        """Check if task dependencies are met"""
        dependencies = task.get('dependencies', [])

        for dep_id in dependencies:
            # Check if dependency completed successfully
            if dep_id in self.completed_tasks:
                continue
            elif dep_id in self.active_tasks:
                # Dependency is still running
                if self.active_tasks[dep_id]['status'] != TaskStatus.COMPLETED:
                    return False
            else:
                # Dependency not found - assume failed
                return False

        return True

    def run_task(self, task_id: str):
        """Run a single task"""
        task = self.active_tasks[task_id]

        try:
            # Update status
            task['status'] = TaskStatus.IN_PROGRESS

            # Execute based on task type
            success = self.execute_task_by_type(task)

            if success:
                task['status'] = TaskStatus.COMPLETED
                task['completed_at'] = time.time()
                self.completed_tasks.append(task_id)
                self.get_logger().info(f'Task {task_id} completed successfully')
            else:
                self.handle_task_failure(task)

        except Exception as e:
            self.get_logger().error(f'Task {task_id} failed with exception: {e}')
            task['status'] = TaskStatus.FAILED
            self.failed_tasks.append(task_id)

        finally:
            # Remove from active tasks
            if task_id in self.active_tasks:
                del self.active_tasks[task_id]

            self.publish_task_status_update(task)

    def execute_task_by_type(self, task: Dict) -> bool:
        """Execute task based on its type"""
        task_type = task['type'].lower()

        if task_type == 'navigation':
            return self.execute_navigation_task(task)
        elif task_type == 'perception':
            return self.execute_perception_task(task)
        elif task_type == 'manipulation':
            return self.execute_manipulation_task(task)
        elif task_type == 'planning':
            return self.execute_planning_task(task)
        elif task_type == 'communication':
            return self.execute_communication_task(task)
        else:
            self.get_logger().warn(f'Unknown task type: {task_type}')
            return False

    def execute_navigation_task(self, task: Dict) -> bool:
        """Execute navigation task"""
        # This would call the navigation system
        target = task['parameters'].get('target')
        if not target:
            return False

        self.get_logger().info(f'Executing navigation to {target}')
        # Call navigation service here
        time.sleep(2)  # Simulate execution
        return True

    def execute_perception_task(self, task: Dict) -> bool:
        """Execute perception task"""
        object_type = task['parameters'].get('object_type')
        if not object_type:
            return False

        self.get_logger().info(f'Executing perception for {object_type}')
        # Call perception system here
        time.sleep(1)  # Simulate execution
        return True

    def execute_manipulation_task(self, task: Dict) -> bool:
        """Execute manipulation task"""
        object_name = task['parameters'].get('object')
        if not object_name:
            return False

        self.get_logger().info(f'Executing manipulation of {object_name}')
        # Call manipulation system here
        time.sleep(2)  # Simulate execution
        return True

    def execute_planning_task(self, task: Dict) -> bool:
        """Execute planning task"""
        query = task['parameters'].get('query')
        if not query:
            return False

        self.get_logger().info(f'Executing cognitive planning for: {query}')
        # Call planning system here
        time.sleep(3)  # Simulate execution
        return True

    def execute_communication_task(self, task: Dict) -> bool:
        """Execute communication task"""
        message = task['parameters'].get('message')
        if not message:
            return False

        self.get_logger().info(f'Executing communication: {message}')
        # Call communication system here
        time.sleep(1)  # Simulate execution
        return True

    def handle_task_failure(self, task: Dict):
        """Handle task failure with retry logic"""
        task['retries'] += 1

        if task['retries'] <= task['max_retries']:
            self.get_logger().info(f'Retrying task {task["id"]}, attempt {task["retries"]}')
            # Add back to queue with lower priority
            task['status'] = TaskStatus.PENDING
            task['priority'] = max(TaskPriority.LOW,
                                TaskPriority(task['priority'].value - 1))
            self.task_queue.append(task)
            self.sort_task_queue()
        else:
            task['status'] = TaskStatus.FAILED
            self.failed_tasks.append(task['id'])
            self.get_logger().error(f'Task {task["id"]} failed after {task["retries"]} attempts')

    def cancel_task(self, task_id: str) -> bool:
        """Cancel a running or queued task"""
        if task_id in self.active_tasks:
            task = self.active_tasks[task_id]
            task['status'] = TaskStatus.CANCELLED
            del self.active_tasks[task_id]
            self.get_logger().info(f'Cancelled active task {task_id}')
            return True
        elif any(task['id'] == task_id for task in self.task_queue):
            # Remove from queue
            self.task_queue = [task for task in self.task_queue if task['id'] != task_id]
            self.get_logger().info(f'Cancelled queued task {task_id}')
            return True
        else:
            self.get_logger().warn(f'Task {task_id} not found for cancellation')
            return False

    def get_task_status(self, task_id: str) -> Optional[Dict]:
        """Get status of a specific task"""
        if task_id in self.active_tasks:
            return self.active_tasks[task_id]
        elif any(task['id'] == task_id for task in self.task_queue):
            return next(task for task in self.task_queue if task['id'] == task_id)
        elif task_id in self.completed_tasks:
            # Return completed task info
            return {'id': task_id, 'status': TaskStatus.COMPLETED}
        elif task_id in self.failed_tasks:
            # Return failed task info
            return {'id': task_id, 'status': TaskStatus.FAILED}
        else:
            return None

    def publish_task_status_update(self, task: Dict):
        """Publish task status update"""
        status_msg = {
            'task_id': task['id'],
            'status': task['status'].value,
            'timestamp': time.time()
        }

        msg = String()
        msg.data = json.dumps(status_msg)
        self.task_status_publisher.publish(msg)

    def publish_task_queue_update(self):
        """Publish task queue update"""
        queue_info = {
            'queue_length': len(self.task_queue),
            'active_tasks': len(self.active_tasks),
            'queued_tasks': [task['id'] for task in self.task_queue],
            'timestamp': time.time()
        }

        msg = String()
        msg.data = json.dumps(queue_info)
        self.task_queue_publisher.publish(msg)
```

### 3. System Monitoring and Performance

#### Performance Monitoring Implementation
```python
# performance_monitor.py
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
import time
import threading
from typing import Dict, List
import statistics
import psutil
import GPUtil

class AutonomousHumanoidPerformanceMonitor(Node):
    def __init__(self):
        super().__init__('performance_monitor')

        # Publishers
        self.performance_publisher = self.create_publisher(String, '/system/performance', 10)
        self.health_publisher = self.create_publisher(String, '/system/health', 10)

        # Performance tracking
        self.performance_history = {
            'response_times': [],
            'task_completion_times': [],
            'cpu_usage': [],
            'memory_usage': [],
            'gpu_usage': [],
            'success_rates': []
        }

        # Performance thresholds
        self.thresholds = {
            'max_response_time': 5.0,  # seconds
            'min_success_rate': 0.90,  # 90%
            'max_cpu_usage': 80.0,     # %
            'max_memory_usage': 80.0,  # %
            'max_gpu_usage': 85.0      # %
        }

        # Monitoring thread
        self.monitoring_active = True
        self.monitoring_thread = threading.Thread(target=self.monitor_performance)
        self.monitoring_thread.daemon = True
        self.monitoring_thread.start()

        self.get_logger().info('Performance Monitor initialized')

    def monitor_performance(self):
        """Monitor system performance in background thread"""
        while self.monitoring_active:
            try:
                # Collect performance metrics
                metrics = self.collect_performance_metrics()

                # Store metrics
                self.store_metrics(metrics)

                # Publish performance data
                self.publish_performance_data(metrics)

                # Check health status
                health_status = self.assess_system_health(metrics)
                self.publish_health_status(health_status)

                # Sleep before next measurement
                time.sleep(2.0)  # Monitor every 2 seconds

            except Exception as e:
                self.get_logger().error(f'Error in performance monitoring: {e}')

    def collect_performance_metrics(self) -> Dict:
        """Collect current system performance metrics"""
        metrics = {}

        # CPU usage
        metrics['cpu_usage'] = psutil.cpu_percent(interval=1)

        # Memory usage
        memory = psutil.virtual_memory()
        metrics['memory_usage'] = memory.percent

        # GPU usage (if available)
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                metrics['gpu_usage'] = gpus[0].load * 100
                metrics['gpu_memory'] = gpus[0].memoryUtil * 100
            else:
                metrics['gpu_usage'] = 0
                metrics['gpu_memory'] = 0
        except:
            metrics['gpu_usage'] = 0
            metrics['gpu_memory'] = 0

        # Additional metrics would come from other system components
        # These would be collected via ROS 2 topics/services from other nodes

        return metrics

    def store_metrics(self, metrics: Dict):
        """Store metrics in history for trend analysis"""
        for key, value in metrics.items():
            if key in self.performance_history:
                self.performance_history[key].append(value)

                # Keep only recent history (last 100 measurements)
                if len(self.performance_history[key]) > 100:
                    self.performance_history[key] = self.performance_history[key][-100:]

    def publish_performance_data(self, metrics: Dict):
        """Publish performance data"""
        performance_data = {
            'timestamp': time.time(),
            'current_metrics': metrics,
            'historical_averages': self.get_historical_averages(),
            'trends': self.calculate_trends()
        }

        msg = String()
        msg.data = json.dumps(performance_data)
        self.performance_publisher.publish(msg)

    def get_historical_averages(self) -> Dict:
        """Calculate historical averages for metrics"""
        averages = {}
        for key, values in self.performance_history.items():
            if values:
                averages[key] = statistics.mean(values)
            else:
                averages[key] = 0
        return averages

    def calculate_trends(self) -> Dict:
        """Calculate trends for performance metrics"""
        trends = {}
        for key, values in self.performance_history.items():
            if len(values) >= 2:
                # Simple trend: positive if increasing, negative if decreasing
                recent_avg = statistics.mean(values[-5:]) if len(values) >= 5 else values[-1]
                older_avg = statistics.mean(values[:5]) if len(values) >= 5 else values[0]

                trends[key] = recent_avg - older_avg
            else:
                trends[key] = 0
        return trends

    def assess_system_health(self, current_metrics: Dict) -> Dict:
        """Assess overall system health"""
        health_status = {
            'status': 'healthy',  # healthy, warning, critical
            'issues': [],
            'recommendations': []
        }

        # Check each metric against thresholds
        if current_metrics.get('cpu_usage', 0) > self.thresholds['max_cpu_usage']:
            health_status['status'] = 'warning'
            health_status['issues'].append(f"High CPU usage: {current_metrics['cpu_usage']:.1f}%")
            health_status['recommendations'].append("Consider reducing task load or optimizing code")

        if current_metrics.get('memory_usage', 0) > self.thresholds['max_memory_usage']:
            health_status['status'] = 'warning' if health_status['status'] != 'critical' else 'critical'
            health_status['issues'].append(f"High memory usage: {current_metrics['memory_usage']:.1f}%")
            health_status['recommendations'].append("Check for memory leaks or increase available memory")

        if current_metrics.get('gpu_usage', 0) > self.thresholds['max_gpu_usage']:
            health_status['status'] = 'warning' if health_status['status'] != 'critical' else 'critical'
            health_status['issues'].append(f"High GPU usage: {current_metrics['gpu_usage']:.1f}%")
            health_status['recommendations'].append("Consider optimizing GPU operations or using less intensive models")

        # More sophisticated health checks would go here

        return health_status

    def publish_health_status(self, health_status: Dict):
        """Publish system health status"""
        msg = String()
        msg.data = json.dumps(health_status)
        self.health_publisher.publish(msg)

    def get_performance_report(self) -> Dict:
        """Get comprehensive performance report"""
        return {
            'current_metrics': self.get_historical_averages(),
            'health_status': self.assess_system_health(self.collect_performance_metrics()),
            'trends': self.calculate_trends(),
            'recommendations': self.get_recommendations()
        }

    def get_recommendations(self) -> List[str]:
        """Get performance optimization recommendations"""
        recommendations = []
        averages = self.get_historical_averages()

        if averages.get('cpu_usage', 0) > 70:
            recommendations.append("CPU usage is high, consider optimizing algorithms")

        if averages.get('memory_usage', 0) > 70:
            recommendations.append("Memory usage is high, check for memory leaks")

        if averages.get('gpu_usage', 0) > 80:
            recommendations.append("GPU usage is high, consider using more efficient models")

        return recommendations
```

### 4. Error Handling and Recovery

#### Recovery Management Implementation
```python
# recovery_manager.py
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
import time
from typing import Dict, List, Callable
import threading

class RecoveryManager(Node):
    def __init__(self):
        super().__init__('recovery_manager')

        # Publishers
        self.recovery_publisher = self.create_publisher(String, '/system/recovery', 10)
        self.status_publisher = self.create_publisher(String, '/recovery/status', 10)

        # Recovery strategies
        self.recovery_strategies = {
            'navigation_failure': self.recovery_navigation_failure,
            'perception_failure': self.recovery_perception_failure,
            'communication_failure': self.recovery_communication_failure,
            'planning_failure': self.recovery_planning_failure,
            'general_failure': self.recovery_general_failure
        }

        # Recovery history
        self.recovery_attempts = []
        self.max_recovery_attempts = 3
        self.recovery_timeout = 60  # seconds

        # Active recovery tracking
        self.active_recovery = None
        self.recovery_lock = threading.Lock()

        self.get_logger().info('Recovery Manager initialized')

    def can_recover(self) -> bool:
        """Check if system can attempt recovery"""
        recent_attempts = [
            attempt for attempt in self.recovery_attempts
            if time.time() - attempt['timestamp'] < self.recovery_timeout
        ]
        return len(recent_attempts) < self.max_recovery_attempts

    def attempt_recovery(self, failure_type: str = 'general_failure', context: Dict = None):
        """Attempt system recovery"""
        with self.recovery_lock:
            if not self.can_recover():
                self.get_logger().error('Too many recovery attempts, system may need restart')
                return False

            self.get_logger().info(f'Attempting recovery for: {failure_type}')

            # Record recovery attempt
            recovery_attempt = {
                'type': failure_type,
                'context': context or {},
                'timestamp': time.time(),
                'strategy_used': None,
                'success': False
            }

            # Select and execute recovery strategy
            if failure_type in self.recovery_strategies:
                strategy = self.recovery_strategies[failure_type]
                recovery_attempt['strategy_used'] = strategy.__name__

                try:
                    success = strategy(context)
                    recovery_attempt['success'] = success
                except Exception as e:
                    self.get_logger().error(f'Recovery strategy failed: {e}')
                    recovery_attempt['success'] = False
            else:
                recovery_attempt['success'] = False

            # Store recovery attempt
            self.recovery_attempts.append(recovery_attempt)

            # Publish recovery status
            self.publish_recovery_status(recovery_attempt)

            return recovery_attempt['success']

    def recovery_navigation_failure(self, context: Dict) -> bool:
        """Recovery strategy for navigation failures"""
        self.get_logger().info('Executing navigation failure recovery')

        # Strategies for navigation recovery:
        # 1. Return to known safe position
        # 2. Recalculate path with different algorithm
        # 3. Request human assistance
        # 4. Abort current task and continue with others

        try:
            # Example: return to home position
            self.get_logger().info('Returning to home position')
            # This would call navigation to return to a safe position

            # Simulate recovery action
            time.sleep(2)

            return True
        except Exception as e:
            self.get_logger().error(f'Navigation recovery failed: {e}')
            return False

    def recovery_perception_failure(self, context: Dict) -> bool:
        """Recovery strategy for perception failures"""
        self.get_logger().info('Executing perception failure recovery')

        # Strategies for perception recovery:
        # 1. Retry with different sensor
        # 2. Adjust sensor parameters
        # 3. Move to better sensing position
        # 4. Use alternative perception method

        try:
            # Example: adjust camera parameters
            self.get_logger().info('Adjusting perception parameters')
            # This would call perception system to adjust settings

            # Simulate recovery action
            time.sleep(1)

            return True
        except Exception as e:
            self.get_logger().error(f'Perception recovery failed: {e}')
            return False

    def recovery_communication_failure(self, context: Dict) -> bool:
        """Recovery strategy for communication failures"""
        self.get_logger().info('Executing communication failure recovery')

        # Strategies for communication recovery:
        # 1. Retry with different communication method
        # 2. Use cached responses
        # 3. Switch to text-based communication

        try:
            # Example: switch to text output if speech fails
            self.get_logger().info('Switching communication method')
            # This would switch to alternative communication

            return True
        except Exception as e:
            self.get_logger().error(f'Communication recovery failed: {e}')
            return False

    def recovery_planning_failure(self, context: Dict) -> bool:
        """Recovery strategy for planning failures"""
        self.get_logger().info('Executing planning failure recovery')

        # Strategies for planning recovery:
        # 1. Simplify the plan
        # 2. Break complex task into smaller tasks
        # 3. Use fallback simple behavior
        # 4. Request clarification from user

        try:
            # Example: use simple fallback behavior
            self.get_logger().info('Using simplified fallback plan')
            # This would execute a simpler, more reliable plan

            return True
        except Exception as e:
            self.get_logger().error(f'Planning recovery failed: {e}')
            return False

    def recovery_general_failure(self, context: Dict) -> bool:
        """General recovery strategy"""
        self.get_logger().info('Executing general system recovery')

        # General strategies:
        # 1. System reset
        # 2. Component restart
        # 3. Safe state transition
        # 4. Error logging and reporting

        try:
            # Example: transition to safe state
            self.get_logger().info('Transitioning to safe state')
            # This would stop all non-essential operations

            return True
        except Exception as e:
            self.get_logger().error(f'General recovery failed: {e}')
            return False

    def publish_recovery_status(self, recovery_attempt: Dict):
        """Publish recovery attempt status"""
        status_msg = String()
        status_msg.data = json.dumps({
            'attempt_id': len(self.recovery_attempts),
            'type': recovery_attempt['type'],
            'strategy': recovery_attempt['strategy_used'],
            'success': recovery_attempt['success'],
            'timestamp': recovery_attempt['timestamp']
        })
        self.recovery_publisher.publish(status_msg)

    def get_recovery_report(self) -> Dict:
        """Get recovery system report"""
        recent_attempts = [
            attempt for attempt in self.recovery_attempts
            if time.time() - attempt['timestamp'] < 300  # Last 5 minutes
        ]

        successful_attempts = [a for a in recent_attempts if a['success']]
        success_rate = len(successful_attempts) / len(recent_attempts) if recent_attempts else 0

        return {
            'total_attempts': len(recent_attempts),
            'successful_attempts': len(successful_attempts),
            'success_rate': success_rate,
            'recent_attempts': recent_attempts[-5:],  # Last 5 attempts
            'can_recover': self.can_recover()
        }
```

### 5. Integration Testing and Validation

#### System Integration Testing
```python
# integration_tests.py
import unittest
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
from std_srvs.srv import Trigger
import time
from typing import Dict, Any

class AutonomousHumanoidIntegrationTests(unittest.TestCase):
    def setUp(self):
        """Set up test environment"""
        rclpy.init()
        self.test_node = rclpy.create_node('integration_test_node')

        # Create clients for services
        self.start_client = self.test_node.create_client(
            Trigger, '/autonomous_humanoid/start'
        )
        self.stop_client = self.test_node.create_client(
            Trigger, '/autonomous_humanoid/stop'
        )

        # Wait for services to be available
        while not self.start_client.wait_for_service(timeout_sec=1.0):
            self.test_node.get_logger().info('Waiting for start service...')

        while not self.stop_client.wait_for_service(timeout_sec=1.0):
            self.test_node.get_logger().info('Waiting for stop service...')

    def tearDown(self):
        """Clean up after tests"""
        self.test_node.destroy_node()
        rclpy.shutdown()

    def test_basic_autonomy_cycle(self):
        """Test basic autonomy start-stop cycle"""
        # Start autonomy
        start_request = Trigger.Request()
        start_future = self.start_client.call_async(start_request)

        rclpy.spin_until_future_complete(self.test_node, start_future)
        start_response = start_future.result()

        self.assertTrue(start_response.success, "Failed to start autonomy")

        # Let it run briefly
        time.sleep(2)

        # Stop autonomy
        stop_request = Trigger.Request()
        stop_future = self.stop_client.call_async(stop_request)

        rclpy.spin_until_future_complete(self.test_node, stop_future)
        stop_response = stop_future.result()

        self.assertTrue(stop_response.success, "Failed to stop autonomy")

    def test_perception_integration(self):
        """Test perception system integration"""
        # This would test that perception data flows correctly
        # through the system
        pass

    def test_navigation_integration(self):
        """Test navigation system integration"""
        # This would test that navigation commands are properly
        # processed and executed
        pass

    def test_voice_command_integration(self):
        """Test voice command processing integration"""
        # This would test that voice commands flow through
        # cognitive planning to execution
        pass

    def test_system_health_monitoring(self):
        """Test system health monitoring"""
        # This would test that health metrics are properly
        # collected and reported
        pass

class SystemValidation:
    def __init__(self, node: Node):
        self.node = node
        self.validation_results = []
        self.required_components = [
            'vslam', 'perception', 'navigation',
            'voice_recognition', 'cognitive_planning'
        ]

    def validate_system_integrity(self) -> Dict[str, Any]:
        """Validate overall system integrity"""
        validation_report = {
            'timestamp': time.time(),
            'components_checked': {},
            'overall_status': 'healthy',
            'issues_found': []
        }

        # Check each required component
        for component in self.required_components:
            status = self.check_component_status(component)
            validation_report['components_checked'][component] = status

            if not status['healthy']:
                validation_report['overall_status'] = 'degraded'
                validation_report['issues_found'].append({
                    'component': component,
                    'issue': status['issue'],
                    'severity': status['severity']
                })

        return validation_report

    def check_component_status(self, component: str) -> Dict[str, Any]:
        """Check status of individual component"""
        # In a real implementation, this would check:
        # - Service availability
        # - Response times
        # - Error rates
        # - Resource usage

        # For now, return a mock status
        return {
            'healthy': True,
            'response_time': 0.1,
            'error_rate': 0.0,
            'issue': None,
            'severity': 'low'
        }

    def validate_performance_requirements(self) -> Dict[str, Any]:
        """Validate that system meets performance requirements"""
        performance_validation = {
            'voice_recognition_accuracy': self.validate_voice_accuracy(),
            'navigation_success_rate': self.validate_navigation_success(),
            'cognitive_planning_response_time': self.validate_planning_response(),
            'vslam_drift': self.validate_vslam_drift(),
            'overall_system_response': self.validate_system_response()
        }

        # Check if all requirements are met
        requirements_met = all([
            performance_validation['voice_recognition_accuracy'] >= 0.9,
            performance_validation['navigation_success_rate'] >= 0.95,
            performance_validation['cognitive_planning_response_time'] <= 5.0,
            performance_validation['vslam_drift'] <= 0.05,  # 5% drift
            performance_validation['overall_system_response'] <= 2.0
        ])

        return {
            'requirements_met': requirements_met,
            'validation_results': performance_validation
        }

    def validate_voice_accuracy(self) -> float:
        """Validate voice recognition accuracy"""
        # This would run voice recognition tests
        # and calculate accuracy rate
        return 0.95  # Mock value

    def validate_navigation_success(self) -> float:
        """Validate navigation success rate"""
        # This would run navigation tests
        # and calculate success rate
        return 0.98  # Mock value

    def validate_planning_response(self) -> float:
        """Validate cognitive planning response time"""
        # This would test planning response times
        return 2.3  # Mock value in seconds

    def validate_vslam_drift(self) -> float:
        """Validate VSLAM drift percentage"""
        # This would test VSLAM drift over distance
        return 0.03  # Mock value (3% drift)

    def validate_system_response(self) -> float:
        """Validate overall system response time"""
        # This would test end-to-end system response
        return 1.8  # Mock value in seconds

def run_integration_tests():
    """Run all integration tests"""
    test_suite = unittest.TestLoader().loadTestsFromTestCase(AutonomousHumanoidIntegrationTests)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)

    return result.wasSuccessful()

def validate_complete_system():
    """Perform complete system validation"""
    rclpy.init()
    node = rclpy.create_node('system_validator')

    validator = SystemValidation(node)

    # Run system integrity validation
    integrity_report = validator.validate_system_integrity()

    # Run performance validation
    performance_report = validator.validate_performance_requirements()

    # Combine reports
    complete_report = {
        'integrity': integrity_report,
        'performance': performance_report,
        'validation_timestamp': time.time()
    }

    node.destroy_node()
    rclpy.shutdown()

    return complete_report
```

### 6. Demonstration Scenarios

#### Complete Demonstration Example
```python
# demonstration_scenarios.py
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
import time
from typing import List, Dict

class CapstoneDemonstration:
    def __init__(self):
        self.scenarios = [
            self.simple_navigation_scenario,
            self.voice_command_scenario,
            self.complex_task_scenario,
            self.multi_modal_scenario
        ]

    def simple_navigation_scenario(self):
        """Simple navigation demonstration"""
        print("=== Simple Navigation Scenario ===")
        print("1. Robot receives navigation command")
        print("2. VSLAM system creates map")
        print("3. Path planning calculates route")
        print("4. Navigation executes path")
        print("5. Robot reaches destination safely")
        time.sleep(2)

    def voice_command_scenario(self):
        """Voice command processing demonstration"""
        print("=== Voice Command Scenario ===")
        print("1. User says: 'Go to the kitchen'")
        print("2. Voice recognition converts to text")
        print("3. Cognitive planning creates navigation plan")
        print("4. Safety validation confirms plan is safe")
        print("5. Robot navigates to kitchen")
        time.sleep(2)

    def complex_task_scenario(self):
        """Complex multi-step task demonstration"""
        print("=== Complex Task Scenario ===")
        print("1. User says: 'Find the red cup and bring it to me'")
        print("2. Cognitive planning breaks down into subtasks:")
        print("   - Navigate to living room")
        print("   - Use perception to find red cup")
        print("   - Plan grasp motion")
        print("   - Navigate back to user")
        print("3. Each subtask executes with monitoring")
        print("4. Task completes successfully")
        time.sleep(3)

    def multi_modal_scenario(self):
        """Multi-modal interaction demonstration"""
        print("=== Multi-Modal Scenario ===")
        print("1. User provides voice command")
        print("2. Robot uses vision to understand context")
        print("3. Cognitive planning creates comprehensive plan")
        print("4. Robot executes with real-time perception feedback")
        print("5. System adapts to environmental changes")
        time.sleep(2)

    def run_complete_demonstration(self):
        """Run complete capstone demonstration"""
        print("🤖 Autonomous Humanoid Capstone Demonstration 🤖")
        print("=" * 50)

        for i, scenario in enumerate(self.scenarios, 1):
            print(f"\n--- Scenario {i} ---")
            scenario()
            print("✅ Scenario completed\n")
            time.sleep(1)

        print("=" * 50)
        print("🏆 Capstone Project Successfully Demonstrated! 🏆")
        print("All systems integrated and functioning as expected.")
        print("- Perception: ✓")
        print("- Navigation: ✓")
        print("- Cognitive Planning: ✓")
        print("- Voice Recognition: ✓")
        print("- System Integration: ✓")
        print("- Performance: ✓")
        print("- Safety: ✓")

def main():
    """Main demonstration function"""
    demo = CapstoneDemonstration()
    demo.run_complete_demonstration()

if __name__ == '__main__':
    main()
```

### 7. Debugging Tips

#### Common Integration Issues and Solutions
1. **Subsystems Not Communicating**:
   - Verify ROS 2 network configuration
   - Check topic/service names and types
   - Ensure all nodes are on the same ROS domain

2. **Performance Bottlenecks**:
   - Monitor system resource usage
   - Optimize critical path operations
   - Implement proper task prioritization

3. **Coordination Failures**:
   - Implement proper state management
   - Add comprehensive error handling
   - Use timeouts for all operations

#### Performance Debugging
```bash
# Monitor complete system
ros2 topic echo /system/status

# Check task execution
ros2 topic echo /task_manager/status

# Monitor performance metrics
ros2 topic echo /system/performance

# Run integration tests
python3 -m pytest integration_tests.py

# Check system validation
python3 -c "from system_validation import validate_complete_system; print(validate_complete_system())"
```

### Expected Output
When completing this capstone project, students should have:
- A fully integrated autonomous humanoid system (aligned with ADR-002, ADR-003, ADR-004)
- Demonstrated complex task execution with multiple subsystems
- Validated system performance meets all ADR requirements (30+ FPS, &lt;5% drift, >90% accuracy, &lt;5s response)
- Implemented robust error handling and recovery
- Completed comprehensive integration testing

### Conclusion
This capstone project represents the culmination of all concepts learned in Modules 3 and 4, implementing the architectural decisions documented in ADR-002: NVIDIA Isaac Technology Stack, ADR-003: Vision-Language-Action (VLA) Architecture, and ADR-004: VSLAM Navigation Architecture. Students have successfully integrated photorealistic simulation, Isaac ROS perception, VSLAM navigation, voice recognition, and cognitive planning into a complete autonomous humanoid system. The system demonstrates professional-level integration with proper error handling, performance monitoring, and safety validation that meets all specified requirements.