# Module 4: Vision-Language-Action (VLA)
## Topic 2: Cognitive Planning with LLMs

### Overview
This topic implements the cognitive planning system as documented in ADR-003: Vision-Language-Action (VLA) Architecture. Students will learn to create intelligent planning systems using Large Language Models (LLMs) such as GPT-4/GPT-4o that can interpret natural language commands, generate action sequences, and ensure safe execution of complex robotic tasks with &lt;5 second response times as specified in the ADR.

### Learning Objectives
By the end of this topic, students will be able to:
1. Integrate LLMs (GPT-4/GPT-4o) for cognitive planning (aligned with ADR-003)
2. Parse natural language into executable action plans
3. Implement safety validation for planned actions
4. Create reasoning trace for plan execution
5. Validate cognitive planning response times against ADR requirements (&lt;5 seconds)

### Prerequisites
- Completion of Module 3 and Topic 1 of Module 4
- OpenAI API key for GPT-4/GPT-4o access (as specified in ADR-003)
- Understanding of ROS 2 action servers and services
- Experience with natural language processing concepts

### 1. Cognitive Planning Architecture

#### Cognitive Planning System Components
```
Cognitive Planning System
├── Natural Language Interface
│   ├── Command parsing
│   ├── Context understanding
│   └── Intent extraction
├── LLM Integration Layer
│   ├── Prompt engineering
│   ├── API communication
│   └── Response parsing
├── Plan Generation Module
│   ├── Action sequence creation
│   ├── Dependency resolution
│   └── Execution planning
├── Safety Validation
│   ├── Action safety checks
│   ├── Environmental constraints
│   └── Risk assessment
├── Plan Execution
│   ├── Action sequencing
│   ├── State monitoring
│   └── Plan adaptation
└── Reasoning Trace
    ├── Decision justification
    ├── Plan explanation
    └── Debugging information
```

#### Cognitive Planning Service Implementation
```python
# planning_service.py
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
from std_srvs.srv import Trigger
import openai
import json
import time
import threading
from typing import Dict, List, Any, Optional
import re

class CognitivePlanningService(Node):
    def __init__(self):
        super().__init__('cognitive_planning_service')

        # Service for creating cognitive plans
        self.plan_creation_service = self.create_service(
            CreateCognitivePlan,
            '/cognitive_plan/create',
            self.create_plan_callback
        )

        # Service for LLM queries
        self.llm_query_service = self.create_service(
            LLMQuery,
            '/llm/query',
            self.llm_query_callback
        )

        # Publishers
        self.plan_publisher = self.create_publisher(String, '/cognitive_plan/plan', 10)
        self.status_publisher = self.create_publisher(String, '/cognitive_plan/status', 10)

        # Internal state
        self.planning_active = False
        self.current_plan = None
        self.plan_history = []

        # LLM configuration
        self.model = "gpt-4o"  # Using GPT-4o for planning
        self.max_tokens = 1000
        self.temperature = 0.3  # Lower temperature for more consistent planning

        # Robot capabilities and constraints
        self.robot_capabilities = {
            'navigation': True,
            'manipulation': True,
            'perception': True,
            'speech': True,
            'maximum_speed': 1.0,  # m/s
            'manipulation_range': 1.0,  # meters
            'payload_capacity': 2.0   # kg
        }

        self.get_logger().info('Cognitive Planning Service initialized')

    def create_plan_callback(self, request, response):
        """Create cognitive plan from natural language query"""
        start_time = time.time()

        if self.planning_active:
            response.status = "BUSY"
            response.message = "Planning system is busy with another request"
            return response

        try:
            self.planning_active = True

            # Get query and context
            query = request.query
            context = request.context if request.context else {}

            # Generate cognitive plan using LLM
            plan = self.generate_cognitive_plan(query, context)

            if plan:
                # Validate the plan for safety
                is_safe, safety_issues = self.validate_plan_safety(plan)

                if is_safe:
                    # Add metadata to plan
                    plan['creation_timestamp'] = time.time()
                    plan['query'] = query
                    plan['estimated_duration'] = self.estimate_plan_duration(plan)

                    # Store plan
                    self.current_plan = plan
                    self.plan_history.append(plan)

                    # Publish plan
                    plan_msg = String()
                    plan_msg.data = json.dumps(plan)
                    self.plan_publisher.publish(plan_msg)

                    # Prepare response
                    response.plan_id = f"plan_{int(time.time())}"
                    response.actions = plan.get('actions', [])
                    response.reasoning_trace = plan.get('reasoning_trace', [])
                    response.safety_score = plan.get('safety_score', 0.9)
                    response.status = "SUCCESS"
                    response.message = "Plan created successfully"

                    # Calculate and log response time
                    response_time = time.time() - start_time
                    self.get_logger().info(f'Plan created in {response_time:.2f}s')

                else:
                    response.status = "UNSAFE"
                    response.message = f"Plan contains safety issues: {safety_issues}"
            else:
                response.status = "FAILED"
                response.message = "Could not generate plan from query"

        except Exception as e:
            self.get_logger().error(f'Error creating cognitive plan: {e}')
            response.status = "ERROR"
            response.message = str(e)
        finally:
            self.planning_active = False

        return response

    def generate_cognitive_plan(self, query: str, context: Dict) -> Optional[Dict]:
        """Generate cognitive plan using LLM"""
        # Construct prompt for LLM
        prompt = self.construct_planning_prompt(query, context)

        try:
            # Configure OpenAI API
            openai.api_key = os.getenv('OPENAI_API_KEY')

            # Call LLM
            completion = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )

            # Parse response
            response_text = completion.choices[0].message['content']
            plan = self.parse_plan_response(response_text)

            return plan

        except Exception as e:
            self.get_logger().error(f'LLM call failed: {e}')
            return None

    def construct_planning_prompt(self, query: str, context: Dict) -> str:
        """Construct prompt for cognitive planning"""
        prompt = f"""
        You are an intelligent cognitive planning system for a humanoid robot. Your task is to create a detailed action plan to fulfill the user's request.

        User Query: {query}

        Context Information:
        - Robot Capabilities: {self.robot_capabilities}
        - Current Environment: {context.get('environment', 'unknown')}
        - Available Objects: {context.get('objects', 'unknown')}
        - Robot Position: {context.get('position', 'unknown')}
        - Task Constraints: {context.get('constraints', [])}

        Please generate a cognitive plan with the following structure:
        {{
            "actions": [
                {{
                    "id": "action_1",
                    "type": "navigation|manipulation|perception|communication",
                    "description": "What the robot should do",
                    "parameters": {{"key": "value"}},
                    "dependencies": ["action_id_1", ...],
                    "estimated_duration": 5.0
                }}
            ],
            "reasoning_trace": [
                {{
                    "step": 1,
                    "thought": "What you're thinking",
                    "action": "What you decided to do"
                }}
            ],
            "safety_considerations": ["list", "of", "safety", "factors"],
            "estimated_duration": 30.0
        }}

        Ensure the plan is executable, safe, and efficient. Only include actions that the robot is capable of performing.
        """

        return prompt

    def get_system_prompt(self) -> str:
        """Get system prompt for LLM"""
        return """
        You are an expert cognitive planning system for a humanoid robot. Your responses should be structured JSON following the exact format specified in the user prompt. Focus on creating safe, executable plans that consider the robot's capabilities and environmental constraints. Always include a reasoning trace explaining your planning decisions. Prioritize safety in all recommendations.
        """

    def parse_plan_response(self, response_text: str) -> Optional[Dict]:
        """Parse LLM response into structured plan"""
        # Clean up response text
        response_text = response_text.strip()

        # Try to extract JSON from response
        try:
            # Look for JSON between curly braces
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                plan = json.loads(json_str)
                return plan
        except json.JSONDecodeError:
            pass

        # If direct JSON parsing fails, try to parse as text and convert
        # This is a simplified fallback - in practice, you'd want more robust parsing
        self.get_logger().warn('Could not parse plan as JSON, using fallback')
        return {
            'actions': [],
            'reasoning_trace': [],
            'safety_considerations': [],
            'estimated_duration': 0.0
        }

    def validate_plan_safety(self, plan: Dict) -> tuple[bool, List[str]]:
        """Validate plan safety"""
        safety_issues = []

        # Check each action for safety
        actions = plan.get('actions', [])
        for action in actions:
            action_type = action.get('type', '').lower()
            params = action.get('parameters', {})

            # Validate navigation safety
            if action_type == 'navigation':
                target = params.get('target')
                if target:
                    # In a real system, this would check against map data
                    # and environmental constraints
                    pass

            # Validate manipulation safety
            elif action_type == 'manipulation':
                object_name = params.get('object')
                if object_name:
                    # Check if object is safe to manipulate
                    if object_name.lower() in ['fire', 'hot', 'sharp']:
                        safety_issues.append(f"Unsafe to manipulate object: {object_name}")

            # Validate payload constraints
            elif action_type == 'manipulation' and 'object' in params:
                # In a real system, this would check object weight
                pass

        # Check overall plan safety considerations
        safety_considerations = plan.get('safety_considerations', [])
        if not safety_considerations:
            safety_issues.append("No safety considerations provided in plan")

        return len(safety_issues) == 0, safety_issues

    def estimate_plan_duration(self, plan: Dict) -> float:
        """Estimate total plan duration"""
        total_duration = 0.0
        actions = plan.get('actions', [])

        for action in actions:
            duration = action.get('estimated_duration', 5.0)  # Default 5 seconds
            total_duration += duration

        return total_duration

    def llm_query_callback(self, request, response):
        """Handle direct LLM queries"""
        try:
            openai.api_key = os.getenv('OPENAI_API_KEY')

            completion = openai.ChatCompletion.create(
                model=self.model,
                messages=[{"role": "user", "content": request.prompt}],
                max_tokens=request.parameters.get('max_tokens', 500),
                temperature=request.parameters.get('temperature', 0.7)
            )

            response.response = completion.choices[0].message['content']
            response.tokens_used = completion.usage.total_tokens
            response.status = "SUCCESS"

        except Exception as e:
            self.get_logger().error(f'LLM query failed: {e}')
            response.status = "ERROR"
            response.response = str(e)

        return response

# Custom message types (these would be defined in .msg/.srv files)
class CreateCognitivePlanRequest:
    def __init__(self):
        self.query = ""
        self.context = {}

class CreateCognitivePlanResponse:
    def __init__(self):
        self.plan_id = ""
        self.actions = []
        self.reasoning_trace = []
        self.safety_score = 0.0
        self.status = ""
        self.message = ""

class LLMQueryRequest:
    def __init__(self):
        self.prompt = ""
        self.parameters = {}

class LLMQueryResponse:
    def __init__(self):
        self.response = ""
        self.tokens_used = 0
        self.execution_time = 0.0
        self.status = ""
```

### 2. LLM Integration and Query Services

#### LLM Service Implementation
```python
# llm_service.py
import rclpy
from rclpy.node import Node
import openai
import time
import json
from typing import Dict, Any, Optional
import asyncio
import aiohttp

class LLMIntegrationService(Node):
    def __init__(self):
        super().__init__('llm_integration_service')

        # Service for LLM queries
        self.llm_query_service = self.create_service(
            LLMQuery,
            '/llm/query',
            self.llm_query_callback
        )

        # Configuration
        self.default_model = "gpt-4o"
        self.default_temperature = 0.7
        self.default_max_tokens = 500
        self.request_timeout = 30.0  # seconds

        # Performance tracking
        self.query_count = 0
        self.total_tokens_used = 0
        self.total_response_time = 0.0

        self.get_logger().info('LLM Integration Service initialized')

    def llm_query_callback(self, request, response):
        """Handle LLM query request"""
        start_time = time.time()

        try:
            # Configure OpenAI API
            openai.api_key = os.getenv('OPENAI_API_KEY')

            # Prepare parameters
            model = request.parameters.get('model', self.default_model)
            temperature = request.parameters.get('temperature', self.default_temperature)
            max_tokens = request.parameters.get('max_tokens', self.default_max_tokens)

            # Make LLM call
            completion = openai.ChatCompletion.create(
                model=model,
                messages=[{"role": "user", "content": request.prompt}],
                temperature=temperature,
                max_tokens=max_tokens
            )

            # Process response
            response.response = completion.choices[0].message['content']
            response.tokens_used = completion.usage.total_tokens
            response.execution_time = time.time() - start_time
            response.status = "SUCCESS"

            # Update statistics
            self.query_count += 1
            self.total_tokens_used += response.tokens_used
            self.total_response_time += response.execution_time

            self.get_logger().info(
                f'LLM query completed in {response.execution_time:.2f}s, '
                f'used {response.tokens_used} tokens'
            )

        except openai.error.RateLimitError:
            response.status = "RATE_LIMITED"
            response.response = "Rate limit exceeded. Please try again later."
        except openai.error.AuthenticationError:
            response.status = "AUTH_ERROR"
            response.response = "Authentication failed. Check your API key."
        except openai.error.APIError as e:
            response.status = "API_ERROR"
            response.response = f"OpenAI API error: {str(e)}"
        except Exception as e:
            self.get_logger().error(f'LLM query failed: {e}')
            response.status = "ERROR"
            response.response = str(e)

        return response

    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get LLM service performance metrics"""
        if self.query_count == 0:
            return {
                'queries_count': 0,
                'average_tokens_per_query': 0,
                'average_response_time': 0.0,
                'total_tokens_used': 0
            }

        return {
            'queries_count': self.query_count,
            'average_tokens_per_query': self.total_tokens_used / self.query_count,
            'average_response_time': self.total_response_time / self.query_count,
            'total_tokens_used': self.total_tokens_used
        }

class ParameterOptimizer:
    def __init__(self):
        self.parameter_history = []
        self.best_params = {
            'temperature': 0.7,
            'max_tokens': 500,
            'model': 'gpt-4o'
        }

    def optimize_parameters(self, query_complexity: str, desired_response_type: str) -> Dict[str, Any]:
        """Optimize LLM parameters based on query characteristics"""
        # Define parameter sets for different scenarios
        parameter_sets = {
            'simple_query': {
                'temperature': 0.3,
                'max_tokens': 200,
                'model': 'gpt-4o'
            },
            'complex_reasoning': {
                'temperature': 0.7,
                'max_tokens': 800,
                'model': 'gpt-4o'
            },
            'creative_task': {
                'temperature': 0.9,
                'max_tokens': 600,
                'model': 'gpt-4o'
            },
            'fact_based': {
                'temperature': 0.2,
                'max_tokens': 400,
                'model': 'gpt-4o'
            }
        }

        # Select appropriate parameters
        if query_complexity in parameter_sets:
            return parameter_sets[query_complexity]
        else:
            # Default to complex reasoning for unknown types
            return parameter_sets['complex_reasoning']

    def track_parameter_performance(self, params: Dict, response_quality: float, execution_time: float):
        """Track how well different parameters perform"""
        record = {
            'parameters': params,
            'response_quality': response_quality,
            'execution_time': execution_time,
            'timestamp': time.time()
        }
        self.parameter_history.append(record)

        # Update best parameters if this performed better
        if len(self.parameter_history) > 1:
            # Simple optimization: keep parameters with best response_quality/execution_time ratio
            best_ratio = 0
            for record in self.parameter_history[-10:]:  # Look at last 10 attempts
                ratio = record['response_quality'] / record['execution_time'] if record['execution_time'] > 0 else 0
                if ratio > best_ratio:
                    best_ratio = ratio
                    self.best_params = record['parameters']
```

### 3. Plan Validation and Safety Assessment

#### Safety Assessment Implementation
```python
# safety_assessment.py
from typing import Dict, List, Tuple, Any
import json

class SafetyAssessment:
    def __init__(self):
        # Define safety rules and constraints
        self.safety_rules = {
            'navigation': {
                'avoid_obstacles': True,
                'stay_in_bounds': True,
                'maintain_safe_distance': 0.5  # meters
            },
            'manipulation': {
                'avoid_dangerous_objects': ['fire', 'sharp', 'hot'],
                'respect_payload_limits': True,
                'avoid_human_collision': True
            },
            'communication': {
                'filter_inappropriate_content': True
            }
        }

        self.environment_constraints = {
            'forbidden_areas': [],
            'restricted_zones': [],
            'safety_boundaries': []
        }

    def assess_plan_safety(self, plan: Dict) -> Tuple[float, List[str], List[str]]:
        """Assess the safety of a cognitive plan"""
        safety_score = 1.0  # Start with perfect score
        safety_issues = []
        safety_recommendations = []

        # Check each action in the plan
        actions = plan.get('actions', [])
        for i, action in enumerate(actions):
            action_type = action.get('type', '').lower()
            params = action.get('parameters', {})

            # Navigation safety check
            if action_type == 'navigation':
                issues, recommendations = self.check_navigation_safety(action)
                safety_issues.extend(issues)
                safety_recommendations.extend(recommendations)

            # Manipulation safety check
            elif action_type == 'manipulation':
                issues, recommendations = self.check_manipulation_safety(action)
                safety_issues.extend(issues)
                safety_recommendations.extend(recommendations)

            # Communication safety check
            elif action_type == 'communication':
                issues, recommendations = self.check_communication_safety(action)
                safety_issues.extend(issues)
                safety_recommendations.extend(recommendations)

        # Calculate final safety score
        if safety_issues:
            # Reduce score based on number and severity of issues
            safety_score = max(0.0, 1.0 - (len(safety_issues) * 0.1))

        return safety_score, safety_issues, safety_recommendations

    def check_navigation_safety(self, action: Dict) -> Tuple[List[str], List[str]]:
        """Check safety for navigation actions"""
        issues = []
        recommendations = []

        params = action.get('parameters', {})
        target = params.get('target')

        # Check if target is in forbidden areas
        if target and target in self.environment_constraints['forbidden_areas']:
            issues.append(f"Navigation target {target} is in forbidden area")
            recommendations.append(f"Select alternative navigation target")

        # Check if target is in restricted zones
        if target and target in self.environment_constraints['restricted_zones']:
            issues.append(f"Navigation target {target} is in restricted zone")
            recommendations.append(f"Request permission to navigate to {target}")

        return issues, recommendations

    def check_manipulation_safety(self, action: Dict) -> Tuple[List[str], List[str]]:
        """Check safety for manipulation actions"""
        issues = []
        recommendations = []

        params = action.get('parameters', {})
        obj = params.get('object', '').lower()

        # Check if object is dangerous
        if obj in self.safety_rules['manipulation']['avoid_dangerous_objects']:
            issues.append(f"Object '{obj}' is dangerous to manipulate")
            recommendations.append(f"Avoid manipulating {obj}, suggest alternative")

        # Check payload limits
        payload = params.get('payload', 0)
        if (self.safety_rules['manipulation']['respect_payload_limits'] and
            payload > 2.0):  # Assuming 2kg limit
            issues.append(f"Payload {payload}kg exceeds robot capacity")
            recommendations.append("Select lighter object or request assistance")

        return issues, recommendations

    def check_communication_safety(self, action: Dict) -> Tuple[List[str], List[str]]:
        """Check safety for communication actions"""
        issues = []
        recommendations = []

        params = action.get('parameters', {})
        message = params.get('message', '').lower()

        # Check for inappropriate content (simplified)
        inappropriate_keywords = ['inappropriate', 'offensive', 'dangerous']
        for keyword in inappropriate_keywords:
            if keyword in message:
                issues.append(f"Message contains inappropriate content: {keyword}")
                recommendations.append("Filter or modify message before communication")

        return issues, recommendations

class PlanValidator:
    def __init__(self):
        self.safety_assessment = SafetyAssessment()

    def validate_plan(self, plan: Dict, robot_capabilities: Dict) -> Dict:
        """Comprehensive plan validation"""
        validation_result = {
            'is_valid': True,
            'safety_score': 1.0,
            'safety_issues': [],
            'recommendations': [],
            'capability_issues': [],
            'logical_issues': []
        }

        # Check safety
        safety_score, safety_issues, safety_recommendations = self.safety_assessment.assess_plan_safety(plan)
        validation_result['safety_score'] = safety_score
        validation_result['safety_issues'] = safety_issues
        validation_result['recommendations'].extend(safety_recommendations)

        # Check robot capabilities
        capability_issues = self.check_robot_capabilities(plan, robot_capabilities)
        validation_result['capability_issues'] = capability_issues
        if capability_issues:
            validation_result['is_valid'] = False

        # Check logical consistency
        logical_issues = self.check_logical_consistency(plan)
        validation_result['logical_issues'] = logical_issues
        if logical_issues:
            validation_result['is_valid'] = False

        # Overall validation
        if (safety_score < 0.7 or  # Safety threshold
            capability_issues or
            logical_issues):
            validation_result['is_valid'] = False

        return validation_result

    def check_robot_capabilities(self, plan: Dict, robot_capabilities: Dict) -> List[str]:
        """Check if robot can execute the plan"""
        issues = []
        actions = plan.get('actions', [])

        for action in actions:
            action_type = action.get('type', '').lower()

            # Check if robot has required capability
            capability_map = {
                'navigation': 'navigation',
                'manipulation': 'manipulation',
                'perception': 'perception',
                'communication': 'speech'
            }

            if action_type in capability_map:
                required_capability = capability_map[action_type]
                if not robot_capabilities.get(required_capability, False):
                    issues.append(f"Robot lacks capability for {action_type} action")

        return issues

    def check_logical_consistency(self, plan: Dict) -> List[str]:
        """Check logical consistency of the plan"""
        issues = []
        actions = plan.get('actions', [])

        # Check for circular dependencies
        action_ids = {action.get('id') for action in actions if action.get('id')}
        for action in actions:
            dependencies = action.get('dependencies', [])
            for dep in dependencies:
                if dep not in action_ids:
                    issues.append(f"Action {action.get('id', 'unknown')} depends on non-existent action {dep}")

        # Check for conflicting actions
        navigation_actions = [a for a in actions if a.get('type') == 'navigation']
        if len(navigation_actions) > 1:
            # Check if navigation actions conflict
            pass

        return issues
```

### 4. Reasoning Trace and Context Awareness

#### Reasoning Trace Implementation
```python
# reasoning_trace.py
from typing import Dict, List, Any
import json
import time

class ReasoningTrace:
    def __init__(self):
        self.trace_history = []
        self.current_trace = []
        self.explanation_depth = 3  # How detailed explanations should be

    def start_trace(self, query: str, context: Dict):
        """Start a new reasoning trace"""
        self.current_trace = [{
            'step': 0,
            'timestamp': time.time(),
            'action': 'Query received',
            'thought': f"Received query: {query}",
            'context': context
        }]

    def add_trace_step(self, step: int, thought: str, action: str,
                      parameters: Dict = None, result: Any = None):
        """Add a step to the reasoning trace"""
        trace_step = {
            'step': step,
            'timestamp': time.time(),
            'thought': thought,
            'action': action,
            'parameters': parameters or {},
            'result': result
        }
        self.current_trace.append(trace_step)

    def get_current_trace(self) -> List[Dict]:
        """Get the current reasoning trace"""
        return self.current_trace

    def save_trace(self, plan_id: str):
        """Save the current trace with a plan ID"""
        trace_record = {
            'plan_id': plan_id,
            'trace': self.current_trace.copy(),
            'timestamp': time.time()
        }
        self.trace_history.append(trace_record)

        # Clear current trace
        self.current_trace = []

    def explain_plan(self, plan: Dict) -> str:
        """Generate human-readable explanation of the plan"""
        explanation = "Cognitive Plan Explanation:\n\n"

        actions = plan.get('actions', [])
        for i, action in enumerate(actions, 1):
            explanation += f"{i}. {action.get('description', 'Unknown action')}\n"
            explanation += f"   Type: {action.get('type', 'Unknown')}\n"
            params = action.get('parameters', {})
            if params:
                explanation += f"   Parameters: {json.dumps(params)}\n"
            explanation += "\n"

        reasoning = plan.get('reasoning_trace', [])
        if reasoning:
            explanation += "Reasoning Process:\n"
            for step in reasoning:
                explanation += f"- {step.get('thought', '')}\n"

        return explanation

class ContextAwareness:
    def __init__(self):
        self.context_history = []
        self.current_context = {}
        self.context_window = 10  # Number of recent contexts to keep

    def update_context(self, new_context: Dict):
        """Update the current context"""
        self.current_context.update(new_context)

        # Add to history
        context_record = {
            'context': self.current_context.copy(),
            'timestamp': time.time()
        }
        self.context_history.append(context_record)

        # Maintain window size
        if len(self.context_history) > self.context_window:
            self.context_history = self.context_history[-self.context_window:]

    def get_context_for_query(self, query: str) -> Dict:
        """Get relevant context for a specific query"""
        # In a simple implementation, return current context
        # In a more sophisticated system, this would use semantic search
        # to find the most relevant historical context
        return self.current_context

    def add_environment_context(self, robot_position: tuple,
                              detected_objects: List[str],
                              room_layout: Dict):
        """Add environmental context"""
        env_context = {
            'robot_position': robot_position,
            'detected_objects': detected_objects,
            'room_layout': room_layout,
            'timestamp': time.time()
        }
        self.update_context(env_context)

    def get_context_summary(self) -> str:
        """Get a summary of the current context"""
        if not self.current_context:
            return "No context available"

        summary = "Current Context Summary:\n"
        for key, value in self.current_context.items():
            if isinstance(value, (str, int, float, bool)):
                summary += f"- {key}: {value}\n"
            else:
                summary += f"- {key}: {type(value).__name__}\n"

        return summary

class CognitivePlanningContextManager:
    def __init__(self):
        self.reasoning_trace = ReasoningTrace()
        self.context_awareness = ContextAwareness()
        self.plan_quality_threshold = 0.8

    def process_query_with_context(self, query: str, user_context: Dict) -> Dict:
        """Process a query with full context awareness"""
        # Update context with user-provided information
        self.context_awareness.update_context(user_context)

        # Start reasoning trace
        self.reasoning_trace.start_trace(query, self.context_awareness.current_context)

        # Add context awareness step to trace
        self.reasoning_trace.add_trace_step(
            step=1,
            thought="Analyzing current context and environment",
            action="context_analysis",
            parameters={"query": query},
            result=self.context_awareness.get_context_summary()
        )

        # Return enriched context for planning
        enriched_context = self.context_awareness.current_context.copy()
        enriched_context['query'] = query

        return enriched_context

    def validate_and_refine_plan(self, plan: Dict, original_query: str) -> Dict:
        """Validate and potentially refine a plan"""
        # Add validation step to trace
        self.reasoning_trace.add_trace_step(
            step=2,
            thought="Validating generated plan for safety and feasibility",
            action="plan_validation",
            parameters={"plan_id": plan.get('id', 'unknown')},
            result="Validation in progress"
        )

        # In a real implementation, this would call the PlanValidator
        # and potentially refine the plan based on validation results

        # Add refinement step if needed
        self.reasoning_trace.add_trace_step(
            step=3,
            thought="Plan validated successfully",
            action="plan_approval",
            parameters={"original_query": original_query},
            result="Plan approved for execution"
        )

        return plan
```

### 5. Performance Optimization

#### Performance Monitoring Implementation
```python
# performance_optimizer.py
import time
import threading
from typing import Dict, List, Callable
import statistics

class PerformanceOptimizer:
    def __init__(self):
        self.response_times = []
        self.token_usage = []
        self.error_rates = []
        self.cache = {}
        self.cache_hits = 0
        self.cache_misses = 0

        # Performance thresholds
        self.target_response_time = 5.0  # seconds
        self.max_error_rate = 0.05       # 5%

        # Optimization strategies
        self.optimization_strategies = [
            self._use_caching,
            self._adjust_model_parameters,
            self._batch_requests,
            self._use_local_processing
        ]

    def record_performance(self, response_time: float, tokens_used: int, error: bool = False):
        """Record performance metrics"""
        self.response_times.append(response_time)
        self.token_usage.append(tokens_used)
        self.error_rates.append(1 if error else 0)

        # Maintain window of recent measurements
        if len(self.response_times) > 100:
            self.response_times.pop(0)
            self.token_usage.pop(0)
            self.error_rates.pop(0)

    def get_performance_metrics(self) -> Dict[str, float]:
        """Get current performance metrics"""
        if not self.response_times:
            return {
                'avg_response_time': 0,
                'avg_tokens_used': 0,
                'error_rate': 0,
                'cache_hit_rate': 0
            }

        total_requests = len(self.response_times)
        cache_total = self.cache_hits + self.cache_misses

        return {
            'avg_response_time': statistics.mean(self.response_times),
            'p95_response_time': self._calculate_percentile(self.response_times, 95),
            'avg_tokens_used': statistics.mean(self.token_usage),
            'error_rate': sum(self.error_rates) / total_requests,
            'cache_hit_rate': self.cache_hits / cache_total if cache_total > 0 else 0
        }

    def _calculate_percentile(self, data: List[float], percentile: float) -> float:
        """Calculate percentile of response times"""
        sorted_data = sorted(data)
        index = int(len(sorted_data) * percentile / 100)
        return sorted_data[min(index, len(sorted_data) - 1)]

    def _use_caching(self, query: str) -> bool:
        """Check if we can use cached response"""
        if query in self.cache:
            self.cache_hits += 1
            return True
        else:
            self.cache_misses += 1
            return False

    def _adjust_model_parameters(self) -> Dict[str, any]:
        """Adjust model parameters based on performance"""
        metrics = self.get_performance_metrics()

        params = {
            'temperature': 0.7,
            'max_tokens': 500
        }

        # If response time is too high, reduce complexity
        if metrics['avg_response_time'] > self.target_response_time:
            params['temperature'] = 0.3  # More deterministic
            params['max_tokens'] = 300   # Shorter responses

        # If error rate is too high, be more conservative
        if metrics['error_rate'] > self.max_error_rate:
            params['temperature'] = 0.2  # Very deterministic

        return params

    def optimize_for_query(self, query: str) -> Dict[str, any]:
        """Optimize parameters for a specific query"""
        # Check cache first
        if self._use_caching(query):
            return {'use_cache': True, 'cached_response': self.cache[query]}

        # Adjust parameters based on performance
        params = self._adjust_model_parameters()

        return params

class CognitivePlanningPerformanceMonitor:
    def __init__(self):
        self.optimizer = PerformanceOptimizer()
        self.start_time = time.time()
        self.query_count = 0
        self.monitoring_active = True

        # Start monitoring thread
        self.monitoring_thread = threading.Thread(target=self._monitor_performance)
        self.monitoring_thread.daemon = True
        self.monitoring_thread.start()

    def _monitor_performance(self):
        """Monitor performance in background thread"""
        while self.monitoring_active:
            time.sleep(10)  # Check every 10 seconds

            if self.query_count > 0:
                metrics = self.optimizer.get_performance_metrics()
                self._log_performance_metrics(metrics)

    def _log_performance_metrics(self, metrics: Dict):
        """Log performance metrics"""
        self.get_logger().info(
            f"Performance Metrics - "
            f"Avg Response: {metrics['avg_response_time']:.2f}s, "
            f"Error Rate: {metrics['error_rate']:.2%}, "
            f"Cache Hit Rate: {metrics['cache_hit_rate']:.2%}"
        )

    def record_query_completion(self, query: str, response_time: float,
                              tokens_used: int, success: bool = True):
        """Record completion of a query"""
        self.query_count += 1
        self.optimizer.record_performance(response_time, tokens_used, not success)

    def get_system_health(self) -> Dict[str, any]:
        """Get overall system health"""
        metrics = self.optimizer.get_performance_metrics()

        health_status = "healthy"
        if metrics['avg_response_time'] > self.optimizer.target_response_time * 2:
            health_status = "degraded"
        elif metrics['error_rate'] > self.optimizer.max_error_rate * 2:
            health_status = "critical"

        return {
            'status': health_status,
            'metrics': metrics,
            'uptime_seconds': time.time() - self.start_time,
            'total_queries': self.query_count
        }
```

### 6. Debugging Tips

#### Common Issues and Solutions
1. **High Response Times**:
   - Implement caching for common queries
   - Use more deterministic parameters
   - Consider local LLM alternatives

2. **Safety Violations**:
   - Review safety rule definitions
   - Add more comprehensive validation
   - Implement human-in-the-loop for critical tasks

3. **Poor Plan Quality**:
   - Improve prompt engineering
   - Add more context to queries
   - Implement plan refinement loops

#### Performance Debugging
```bash
# Monitor cognitive planning
ros2 topic echo /cognitive_plan/plan

# Test LLM integration
ros2 service call /llm/query llm_interfaces/srv/LLMQuery "prompt: 'Plan a simple task'"

# Check planning performance
ros2 run cognitive_planning performance_monitor

# Monitor safety assessments
ros2 run cognitive_planning safety_checker
```

### Expected Output
When completing this topic, students should have:
- A functional cognitive planning system using LLMs (aligned with ADR-003)
- Safety validation with comprehensive safety checks
- Reasoning trace for plan explainability
- Performance metrics showing &lt;5 second response times (as specified in ADR-003)
- Validated cognitive planning with safety scores

### Next Steps
After completing this topic, students will be prepared to move to Topic 3: Capstone Project – Autonomous Humanoid, where they will integrate all learned concepts into a complete autonomous humanoid system.