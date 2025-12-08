# Module 4: Vision-Language-Action (VLA)
## Topic 1: Voice-to-Action (OpenAI Whisper)

### Overview
This topic implements the voice recognition and voice-to-action system as documented in ADR-003: Vision-Language-Action (VLA) Architecture. Students will learn to implement voice command processing using OpenAI Whisper that converts natural language commands into robotic actions, enabling intuitive human-robot interaction through speech with >90% accuracy as specified in the ADR.

### Learning Objectives
By the end of this topic, students will be able to:
1. Integrate OpenAI Whisper for voice recognition (aligned with ADR-003)
2. Process voice commands and convert them to text
3. Parse natural language commands into actionable intents
4. Map voice commands to robotic actions
5. Validate voice recognition accuracy and response times against ADR requirements (>90% accuracy)

### Prerequisites
- Completion of Module 3
- OpenAI API key for Whisper service (as specified in ADR-003)
- Basic understanding of natural language processing
- Experience with ROS 2 services and topics

### 1. Voice Recognition Service Architecture

#### Voice Recognition System Components
```
Voice Recognition System
├── Audio Input Module
│   ├── Microphone interface
│   ├── Audio preprocessing
│   └── Noise reduction
├── Voice-to-Text Service
│   ├── OpenAI Whisper integration
│   ├── Audio format conversion
│   └── Text transcription
├── Command Processing
│   ├── Intent parsing
│   ├── Parameter extraction
│   └── Command validation
├── Action Mapping
│   ├── Voice command to action mapping
│   ├── Action sequence generation
│   └── Safety validation
└── Response System
    ├── Text-to-speech output
    ├── Action confirmation
    └── Error handling
```

#### Voice Recognition Service Implementation
```python
# voice_service.py
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
from std_srvs.srv import Trigger
from audio_common_msgs.msg import AudioData
import pyaudio
import wave
import numpy as np
import threading
import time
from typing import Optional

class VoiceRecognitionService(Node):
    def __init__(self):
        super().__init__('voice_recognition_service')

        # Service definitions
        self.start_listening_service = self.create_service(
            Trigger,
            '/voice/start_listening',
            self.start_listening_callback
        )

        self.stop_listening_service = self.create_service(
            Trigger,
            '/voice/stop_listening',
            self.stop_listening_callback
        )

        self.transcribe_service = self.create_service(
            TranscribeRequest,
            '/voice/transcribe',
            self.transcribe_callback
        )

        # Publishers
        self.audio_publisher = self.create_publisher(AudioData, '/audio/raw', 10)
        self.command_publisher = self.create_publisher(String, '/voice/command', 10)

        # Internal state
        self.listening_active = False
        self.recording_thread = None
        self.audio_buffer = []
        self.session_id = None

        # Audio parameters
        self.sample_rate = 16000
        self.chunk_size = 1024
        self.audio_format = pyaudio.paInt16
        self.channels = 1

        # Initialize PyAudio
        self.pyaudio_instance = pyaudio.PyAudio()

        self.get_logger().info('Voice Recognition Service initialized')

    def start_listening_callback(self, request, response):
        """Start voice recognition session"""
        if self.listening_active:
            response.success = False
            response.message = 'Already listening'
            return response

        self.listening_active = True
        self.session_id = f"session_{int(time.time())}"

        # Start recording thread
        self.recording_thread = threading.Thread(target=self.record_audio)
        self.recording_thread.daemon = True
        self.recording_thread.start()

        response.success = True
        response.message = f'Started listening session: {self.session_id}'
        return response

    def stop_listening_callback(self, request, response):
        """Stop voice recognition session"""
        if not self.listening_active:
            response.success = False
            response.message = 'Not currently listening'
            return response

        self.listening_active = False

        if self.recording_thread and self.recording_thread.is_alive():
            self.recording_thread.join(timeout=2.0)

        # Process accumulated audio
        if self.audio_buffer:
            command = self.process_audio_buffer(self.audio_buffer)
            if command:
                self.publish_command(command)
                response.success = True
                response.message = f'Processed command: {command}'
            else:
                response.success = False
                response.message = 'No command detected'
        else:
            response.success = False
            response.message = 'No audio recorded'

        return response

    def record_audio(self):
        """Record audio from microphone"""
        stream = self.pyaudio_instance.open(
            format=self.audio_format,
            channels=self.channels,
            rate=self.sample_rate,
            input=True,
            frames_per_buffer=self.chunk_size
        )

        self.get_logger().info('Started audio recording')

        while self.listening_active:
            try:
                data = stream.read(self.chunk_size, exception_on_overflow=False)
                self.audio_buffer.append(data)

                # Publish raw audio data
                audio_msg = AudioData()
                audio_msg.data = data
                self.audio_publisher.publish(audio_msg)

            except Exception as e:
                self.get_logger().error(f'Error recording audio: {e}')
                break

        stream.stop_stream()
        stream.close()

        self.get_logger().info('Stopped audio recording')

    def process_audio_buffer(self, audio_buffer):
        """Process accumulated audio buffer"""
        if not audio_buffer:
            return None

        # Convert audio buffer to numpy array
        audio_data = b''.join(audio_buffer)
        audio_array = np.frombuffer(audio_data, dtype=np.int16)

        # Normalize audio
        audio_array = audio_array.astype(np.float32) / 32768.0

        # Check if audio has sufficient energy (not just silence)
        energy = np.mean(np.abs(audio_array))
        if energy < 0.01:  # Threshold for silence
            self.get_logger().info('Audio is too quiet, likely silence')
            return None

        # Save to temporary file for Whisper processing
        temp_filename = f'/tmp/voice_command_{int(time.time())}.wav'
        self.save_audio_to_wav(audio_array, temp_filename)

        # Transcribe using Whisper
        transcribed_text = self.transcribe_audio(temp_filename)

        # Clean up temporary file
        import os
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

        return transcribed_text

    def save_audio_to_wav(self, audio_array, filename):
        """Save audio array to WAV file"""
        with wave.open(filename, 'wb') as wf:
            wf.setnchannels(self.channels)
            wf.setsampwidth(2)  # 2 bytes for int16
            wf.setframerate(self.sample_rate)
            wf.writeframes((audio_array * 32767).astype(np.int16).tobytes())

    def transcribe_audio(self, audio_file_path):
        """Transcribe audio using OpenAI Whisper"""
        import openai

        # Configure OpenAI API key (should be set in environment)
        openai.api_key = os.getenv('OPENAI_API_KEY')

        try:
            with open(audio_file_path, 'rb') as audio_file:
                transcript = openai.Audio.transcribe("whisper-1", audio_file)
            return transcript.text
        except Exception as e:
            self.get_logger().error(f'Whisper transcription failed: {e}')
            return None

    def publish_command(self, command_text):
        """Publish recognized command"""
        cmd_msg = String()
        cmd_msg.data = command_text
        self.command_publisher.publish(cmd_msg)
        self.get_logger().info(f'Published command: {command_text}')

class TranscriptionService(Node):
    def __init__(self):
        super().__init__('transcription_service')

        self.transcribe_service = self.create_service(
            TranscribeRequest,
            '/voice/transcribe',
            self.transcribe_callback
        )

        self.get_logger().info('Transcription Service initialized')

    def transcribe_callback(self, request, response):
        """Transcribe audio data to text"""
        import openai
        import os

        # Configure OpenAI API key
        openai.api_key = os.getenv('OPENAI_API_KEY')

        # Save audio data to temporary file
        temp_filename = f'/tmp/transcribe_{int(time.time())}.wav'

        try:
            # Write audio data to file
            with open(temp_filename, 'wb') as f:
                f.write(request.audio_data.data)

            # Transcribe using Whisper
            with open(temp_filename, 'rb') as audio_file:
                transcript = openai.Audio.transcribe("whisper-1", audio_file)

            response.text = transcript.text
            response.confidence = 0.9  # Placeholder - Whisper doesn't return confidence
            response.success = True
            response.message = 'Transcription successful'

        except Exception as e:
            self.get_logger().error(f'Transcription failed: {e}')
            response.success = False
            response.message = str(e)

        finally:
            # Clean up temporary file
            import os
            if os.path.exists(temp_filename):
                os.remove(temp_filename)

        return response

# Custom message types (these would be defined in .msg files)
from std_msgs.msg import Header
from builtin_interfaces.msg import Time

class TranscribeRequest:
    def __init__(self):
        self.header = Header()
        self.audio_data = None  # AudioData message
        self.language = "en"    # Language code

class TranscribeResponse:
    def __init__(self):
        self.header = Header()
        self.text = ""
        self.confidence = 0.0
        self.success = False
        self.message = ""
```

### 2. Voice Command Processing and Intent Parsing

#### Intent Parser Implementation
```python
# intent_parser.py
import re
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class ParsedCommand:
    intent: str
    parameters: Dict[str, str]
    confidence: float
    raw_text: str

class IntentParser:
    def __init__(self):
        # Define command patterns and their corresponding intents
        self.command_patterns = [
            # Navigation commands
            {
                'intent': 'navigate_to',
                'patterns': [
                    r'go to (?P<location>\w+)',
                    r'move to (?P<location>\w+)',
                    r'travel to (?P<location>\w+)',
                    r'go to the (?P<location>\w+)',
                    r'move to the (?P<location>\w+)'
                ]
            },
            # Movement commands
            {
                'intent': 'move_forward',
                'patterns': [
                    r'go forward (?P<distance>[\d.]+) meters?',
                    r'move forward (?P<distance>[\d.]+) meters?',
                    r'go straight (?P<distance>[\d.]+) meters?',
                    r'forward (?P<distance>[\d.]+) meters?'
                ]
            },
            {
                'intent': 'turn',
                'patterns': [
                    r'turn (?P<direction>left|right) (?P<angle>[\d.]+) degrees?',
                    r'rotate (?P<direction>left|right) (?P<angle>[\d.]+) degrees?',
                    r'pivot (?P<direction>left|right) (?P<angle>[\d.]+) degrees?'
                ]
            },
            # Object interaction
            {
                'intent': 'grasp_object',
                'patterns': [
                    r'pick up the (?P<object>\w+)',
                    r'grasp the (?P<object>\w+)',
                    r'take the (?P<object>\w+)',
                    r'grab the (?P<object>\w+)'
                ]
            },
            # Stop/Wait commands
            {
                'intent': 'stop',
                'patterns': [
                    r'stop',
                    r'hold on',
                    r'wait',
                    r'pause'
                ]
            },
            # General commands
            {
                'intent': 'greet',
                'patterns': [
                    r'hello',
                    r'hi',
                    r'hey',
                    r'good morning',
                    r'good afternoon'
                ]
            }
        ]

        # Location mappings
        self.location_map = {
            'kitchen': 'kitchen_waypoint',
            'bedroom': 'bedroom_waypoint',
            'living room': 'living_room_waypoint',
            'dining room': 'dining_room_waypoint',
            'bathroom': 'bathroom_waypoint',
            'office': 'office_waypoint'
        }

    def parse_command(self, text: str) -> Optional[ParsedCommand]:
        """Parse text command and extract intent and parameters"""
        text = text.lower().strip()

        for command_def in self.command_patterns:
            for pattern in command_def['patterns']:
                match = re.search(pattern, text)
                if match:
                    parameters = match.groupdict()

                    # Map location names to waypoints if needed
                    if 'location' in parameters:
                        location = parameters['location']
                        if location in self.location_map:
                            parameters['waypoint'] = self.location_map[location]
                        else:
                            parameters['waypoint'] = location

                    # Calculate confidence based on pattern match quality
                    confidence = self.calculate_confidence(text, pattern)

                    return ParsedCommand(
                        intent=command_def['intent'],
                        parameters=parameters,
                        confidence=confidence,
                        raw_text=text
                    )

        return None

    def calculate_confidence(self, text: str, pattern: str) -> float:
        """Calculate confidence score for pattern match"""
        # Simple confidence calculation based on text length and pattern complexity
        # More sophisticated NLP could be used for better confidence estimation
        pattern_complexity = len(pattern.split())
        text_length = len(text.split())

        # Base confidence on how much of the text was matched
        match_ratio = len(re.findall(r'\w+', pattern)) / len(re.findall(r'\w+', text))
        return min(0.9, 0.5 + (match_ratio * 0.4))

    def validate_command(self, parsed_command: ParsedCommand) -> bool:
        """Validate that the parsed command has required parameters"""
        required_params = {
            'navigate_to': ['location'],
            'move_forward': ['distance'],
            'turn': ['direction', 'angle'],
            'grasp_object': ['object']
        }

        intent = parsed_command.intent
        if intent in required_params:
            required = required_params[intent]
            for param in required:
                if param not in parsed_command.parameters:
                    return False
                if not parsed_command.parameters[param]:
                    return False

        return True

class VoiceCommandProcessor:
    def __init__(self):
        self.intent_parser = IntentParser()
        self.command_history = []
        self.min_confidence = 0.7  # Minimum confidence for command acceptance

    def process_voice_command(self, text: str) -> Optional[ParsedCommand]:
        """Process voice command text and return parsed command"""
        # Parse the command
        parsed_command = self.intent_parser.parse_command(text)

        if parsed_command is None:
            return None

        # Validate confidence
        if parsed_command.confidence < self.min_confidence:
            return None

        # Validate required parameters
        if not self.intent_parser.validate_command(parsed_command):
            return None

        # Add to history
        self.command_history.append(parsed_command)

        return parsed_command

    def get_command_suggestions(self, partial_text: str) -> List[str]:
        """Get command suggestions based on partial text"""
        suggestions = []
        for command_def in self.intent_parser.command_patterns:
            for pattern in command_def['patterns']:
                # Create a simplified version for suggestion matching
                simplified_pattern = pattern.replace(r'(?P<\w+>[\w\s]+)', '<value>')
                simplified_pattern = simplified_pattern.replace(r'(?P<\w+>[\d.]+)', '<number>')
                if partial_text.lower() in simplified_pattern.lower():
                    suggestions.append(simplified_pattern)

        return suggestions[:5]  # Return top 5 suggestions
```

### 3. Voice-to-Action Mapping

#### Action Mapping Implementation
```python
# action_mapper.py
from typing import Dict, Any, Callable, Optional
import rclpy
from rclpy.action import ActionClient
from geometry_msgs.msg import PoseStamped
from std_msgs.msg import String
import math

class ActionMapper:
    def __init__(self, node):
        self.node = node
        self.action_clients = {}
        self.waypoints = {
            'kitchen_waypoint': (2.0, 1.0, 0.0),
            'bedroom_waypoint': (-1.0, 2.0, 0.0),
            'living_room_waypoint': (0.0, 0.0, 0.0),
            'office_waypoint': (-2.0, -1.0, 0.0)
        }

        # Initialize action clients for navigation
        self.nav_to_pose_client = ActionClient(
            self.node,
            NavigateToPose,
            'navigate_to_pose'
        )

    def map_voice_command_to_action(self, parsed_command):
        """Map parsed voice command to robotic action"""
        intent = parsed_command.intent
        parameters = parsed_command.parameters

        action_mapping = {
            'navigate_to': self.navigate_to_location,
            'move_forward': self.move_forward_distance,
            'turn': self.turn_direction,
            'grasp_object': self.grasp_object,
            'stop': self.stop_robot,
            'greet': self.respond_greeting
        }

        if intent in action_mapping:
            return action_mapping[intent](parameters)
        else:
            self.node.get_logger().warn(f'Unknown intent: {intent}')
            return None

    def navigate_to_location(self, parameters):
        """Navigate to a specific location"""
        location = parameters.get('location', '').lower()
        waypoint_key = parameters.get('waypoint', location)

        if waypoint_key in self.waypoints:
            x, y, theta = self.waypoints[waypoint_key]

            # Create navigation goal
            goal_msg = NavigateToPose.Goal()
            goal_msg.pose.header.frame_id = 'map'
            goal_msg.pose.pose.position.x = float(x)
            goal_msg.pose.pose.position.y = float(y)

            # Convert theta to quaternion
            from tf_transformations import quaternion_from_euler
            quat = quaternion_from_euler(0, 0, theta)
            goal_msg.pose.pose.orientation.x = quat[0]
            goal_msg.pose.pose.orientation.y = quat[1]
            goal_msg.pose.pose.orientation.z = quat[2]
            goal_msg.pose.pose.orientation.w = quat[3]

            # Send navigation goal
            self.nav_to_pose_client.wait_for_server()
            future = self.nav_to_pose_client.send_goal_async(goal_msg)

            self.node.get_logger().info(f'Navigating to {location} at ({x}, {y})')
            return future
        else:
            self.node.get_logger().warn(f'Unknown location: {location}')
            return None

    def move_forward_distance(self, parameters):
        """Move robot forward by specified distance"""
        try:
            distance = float(parameters.get('distance', 0))
        except ValueError:
            self.node.get_logger().warn('Invalid distance parameter')
            return None

        # This would typically involve creating a path of specified distance
        # and sending it to the navigation system
        self.node.get_logger().info(f'Moving forward {distance} meters')

        # In a real implementation, this would create a relative navigation goal
        # For now, we'll simulate by creating a simple movement command
        cmd_vel_publisher = self.node.create_publisher(Twist, '/cmd_vel', 10)

        # Create movement command (simplified)
        cmd_msg = Twist()
        cmd_msg.linear.x = 0.5  # 0.5 m/s
        duration = distance / 0.5  # Time to travel distance at 0.5 m/s

        # This is a simplified example - in practice, you'd use the navigation stack
        # to create a proper path and execute it
        self.node.get_logger().info(f'Would move forward {distance} meters')
        return True

    def turn_direction(self, parameters):
        """Turn robot in specified direction by specified angle"""
        direction = parameters.get('direction', 'left')
        try:
            angle_deg = float(parameters.get('angle', 0))
        except ValueError:
            self.node.get_logger().warn('Invalid angle parameter')
            return None

        angle_rad = math.radians(angle_deg)

        # Determine turn direction
        if direction.lower() == 'right':
            angle_rad = -angle_rad

        self.node.get_logger().info(f'Turning {direction} by {angle_deg} degrees')

        # In a real implementation, this would create a rotation navigation goal
        self.node.get_logger().info(f'Would turn {direction} by {angle_deg} degrees')
        return True

    def grasp_object(self, parameters):
        """Grasp specified object"""
        obj = parameters.get('object', '').lower()

        self.node.get_logger().info(f'Attempting to grasp {obj}')

        # In a real implementation, this would:
        # 1. Navigate to the object location
        # 2. Use computer vision to locate the object
        # 3. Plan and execute grasping motion
        # 4. Confirm grasp success

        # For simulation purposes
        self.node.get_logger().info(f'Grasping sequence initiated for {obj}')
        return True

    def stop_robot(self, parameters):
        """Stop robot movement"""
        cmd_vel_publisher = self.node.create_publisher(Twist, '/cmd_vel', 10)
        cmd_msg = Twist()
        cmd_msg.linear.x = 0.0
        cmd_msg.angular.z = 0.0
        cmd_vel_publisher.publish(cmd_msg)

        self.node.get_logger().info('Robot stopped')
        return True

    def respond_greeting(self, parameters):
        """Respond to greeting"""
        # In a real implementation, this would trigger text-to-speech
        response_publisher = self.node.create_publisher(String, '/robot/response', 10)
        response_msg = String()
        response_msg.data = "Hello! How can I assist you today?"
        response_publisher.publish(response_msg)

        self.node.get_logger().info('Responded to greeting')
        return True

class VoiceToActionService(Node):
    def __init__(self):
        super().__init__('voice_to_action_service')

        # Subscribe to voice commands
        self.command_subscriber = self.create_subscription(
            String,
            '/voice/command',
            self.voice_command_callback,
            10
        )

        # Initialize action mapper
        self.action_mapper = ActionMapper(self)

        # Command processor
        self.command_processor = VoiceCommandProcessor()

        self.get_logger().info('Voice-to-Action Service initialized')

    def voice_command_callback(self, msg):
        """Process incoming voice command"""
        text = msg.data
        self.get_logger().info(f'Received voice command: {text}')

        # Process the command
        parsed_command = self.command_processor.process_voice_command(text)

        if parsed_command:
            self.get_logger().info(
                f'Parsed command - Intent: {parsed_command.intent}, '
                f'Confidence: {parsed_command.confidence:.2f}'
            )

            # Map to action
            action_result = self.action_mapper.map_voice_command_to_action(parsed_command)

            if action_result:
                self.get_logger().info(f'Action executed for command: {text}')
            else:
                self.get_logger().warn(f'Failed to execute action for command: {text}')
        else:
            self.get_logger().warn(f'Could not parse command: {text}')
```

### 4. Voice Recognition Accuracy Monitoring

#### Accuracy Monitoring Implementation
```python
# accuracy_monitor.py
import time
from typing import Dict, List, Tuple
from collections import deque
import numpy as np

class VoiceRecognitionAccuracyMonitor:
    def __init__(self, window_size=100):
        self.window_size = window_size
        self.command_history = deque(maxlen=window_size)
        self.error_history = deque(maxlen=window_size)
        self.response_time_history = deque(maxlen=window_size)

        # Statistics
        self.total_commands = 0
        self.successful_commands = 0
        self.failed_commands = 0

    def record_command(self, command_text: str, success: bool, response_time: float):
        """Record a voice command and its outcome"""
        self.total_commands += 1

        if success:
            self.successful_commands += 1
        else:
            self.failed_commands += 1

        self.command_history.append({
            'text': command_text,
            'success': success,
            'timestamp': time.time(),
            'response_time': response_time
        })

        self.response_time_history.append(response_time)

    def calculate_accuracy(self) -> float:
        """Calculate overall accuracy rate"""
        if self.total_commands == 0:
            return 0.0
        return (self.successful_commands / self.total_commands) * 100

    def calculate_average_response_time(self) -> float:
        """Calculate average response time"""
        if not self.response_time_history:
            return 0.0
        return np.mean(self.response_time_history)

    def get_accuracy_report(self) -> Dict:
        """Get comprehensive accuracy report"""
        return {
            'total_commands': self.total_commands,
            'successful_commands': self.successful_commands,
            'failed_commands': self.failed_commands,
            'accuracy_percentage': self.calculate_accuracy(),
            'average_response_time_ms': self.calculate_average_response_time() * 1000,
            'last_10_accuracy': self.get_recent_accuracy(10),
            'last_50_accuracy': self.get_recent_accuracy(50)
        }

    def get_recent_accuracy(self, n: int) -> float:
        """Calculate accuracy for last N commands"""
        recent_commands = list(self.command_history)[-n:]
        if not recent_commands:
            return 0.0

        successful = sum(1 for cmd in recent_commands if cmd['success'])
        return (successful / len(recent_commands)) * 100

    def is_performance_acceptable(self, min_accuracy=90.0, max_response_time=2.0) -> bool:
        """Check if performance meets requirements"""
        current_accuracy = self.calculate_accuracy()
        avg_response_time = self.calculate_average_response_time()

        return (current_accuracy >= min_accuracy and
                avg_response_time <= max_response_time)

    def get_performance_recommendations(self) -> List[str]:
        """Get recommendations based on performance"""
        recommendations = []
        current_accuracy = self.calculate_accuracy()
        avg_response_time = self.calculate_average_response_time()

        if current_accuracy < 90:
            recommendations.append("Consider improving audio preprocessing for noise reduction")
            recommendations.append("Verify OpenAI API key and service availability")
            recommendations.append("Check microphone quality and positioning")

        if avg_response_time > 2.0:
            recommendations.append("Consider using local speech recognition for faster response")
            recommendations.append("Optimize network connection to OpenAI API")
            recommendations.append("Implement command caching for common commands")

        if self.failed_commands > self.successful_commands * 0.1:  # 10% failure rate
            recommendations.append("Review command parsing patterns for common failure cases")
            recommendations.append("Add more robust error handling and retry logic")

        return recommendations

class VoiceRecognitionHealthChecker:
    def __init__(self):
        self.accuracy_monitor = VoiceRecognitionAccuracyMonitor()
        self.health_status = "healthy"
        self.last_check_time = time.time()

    def check_health(self) -> Dict:
        """Perform comprehensive health check"""
        report = self.accuracy_monitor.get_accuracy_report()

        # Determine health status
        if report['accuracy_percentage'] < 80:
            self.health_status = "critical"
        elif report['accuracy_percentage'] < 90:
            self.health_status = "warning"
        else:
            self.health_status = "healthy"

        return {
            'status': self.health_status,
            'accuracy_report': report,
            'recommendations': self.accuracy_monitor.get_performance_recommendations(),
            'timestamp': time.time()
        }

    def is_healthy(self) -> bool:
        """Check if voice recognition system is healthy"""
        return self.health_status in ["healthy", "warning"]
```

### 5. Integration with ROS 2 System

#### Complete Integration Example
```python
# main_voice_system.py
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
from sensor_msgs.msg import AudioData
import threading
import time
import os

def main(args=None):
    rclpy.init(args=args)

    # Create all voice system nodes
    voice_service = VoiceRecognitionService()
    transcription_service = TranscriptionService()
    voice_to_action_service = VoiceToActionService()

    # Create executor to handle multiple nodes
    executor = rclpy.executors.MultiThreadedExecutor()
    executor.add_node(voice_service)
    executor.add_node(transcription_service)
    executor.add_node(voice_to_action_service)

    try:
        executor.spin()
    except KeyboardInterrupt:
        pass
    finally:
        # Cleanup
        voice_service.destroy_node()
        transcription_service.destroy_node()
        voice_to_action_service.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
```

### 6. Debugging Tips

#### Common Issues and Solutions
1. **Poor Voice Recognition**:
   - Check microphone quality and positioning
   - Verify OpenAI API key and rate limits
   - Ensure proper audio format conversion

2. **High Latency**:
   - Consider using local Whisper models
   - Optimize network connection to API
   - Implement audio buffering

3. **Command Misinterpretation**:
   - Expand command pattern definitions
   - Improve confidence threshold tuning
   - Add context-aware parsing

#### Performance Debugging
```bash
# Monitor voice recognition
ros2 topic echo /voice/command

# Test transcription service
ros2 service call /voice/transcribe voice_interfaces/srv/Transcribe "audio_data: {data: '...'}"

# Check voice-to-action mapping
ros2 run voice_to_action health_check

# Monitor accuracy metrics
ros2 run voice_to_action accuracy_monitor
```

### Expected Output
When completing this topic, students should have:
- A functional voice recognition system using OpenAI Whisper (aligned with ADR-003)
- Voice command processing with intent parsing
- Voice-to-action mapping with robotic command execution
- Accuracy monitoring showing >90% recognition accuracy (as specified in ADR-003)
- Validated response times under 2 seconds (aligned with ADR-003 performance targets)

### Next Steps
After completing this topic, students will be prepared to move to Topic 2: Cognitive Planning with LLMs, where they will learn to integrate large language models for higher-level planning and reasoning.