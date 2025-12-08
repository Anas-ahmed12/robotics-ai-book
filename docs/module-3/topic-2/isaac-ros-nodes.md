# Module 3: AI-Robot Brain (NVIDIA Isaac™)
## Topic 2: Isaac ROS Nodes

### Overview
This topic covers the implementation of Isaac ROS nodes, which provide GPU-accelerated perception capabilities for robotics applications. Isaac ROS nodes bridge the gap between photorealistic simulation and real-time perception processing, enabling efficient processing of sensor data using NVIDIA hardware acceleration.

### Learning Objectives
By the end of this topic, students will be able to:
1. Understand the architecture of Isaac ROS nodes
2. Implement GPU-accelerated perception nodes for object detection and classification
3. Integrate Isaac ROS nodes with ROS 2 ecosystem
4. Optimize perception pipelines for real-time performance
5. Validate perception outputs for accuracy and reliability

### Prerequisites
- Completion of Topic 1: Photorealistic Simulation in Isaac Sim
- ROS 2 Humble Hawksbill installed
- NVIDIA GPU with CUDA support
- Isaac ROS packages installed
- Basic understanding of ROS 2 concepts (topics, services, nodes)

### 1. Isaac ROS Architecture

#### Isaac ROS Node Structure
Isaac ROS nodes follow the standard ROS 2 node pattern but are optimized for GPU acceleration:

```
Isaac ROS Node
├── Input Interface
│   ├── ROS 2 Subscribers (sensor_msgs/Image, sensor_msgs/CameraInfo)
│   └── Isaac-specific message types
├── GPU Processing Pipeline
│   ├── CUDA memory management
│   ├── TensorRT optimization
│   └── Inference acceleration
├── Output Interface
│   ├── ROS 2 Publishers (object detection results, classifications)
│   └── Isaac-specific result types
└── Configuration Layer
    ├── Parameter server integration
    └── Performance tuning parameters
```

#### Base Node Implementation
```python
# base_node.py
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile
import numpy as np
import cv2
from sensor_msgs.msg import Image
from std_msgs.msg import Header
import torch
import cuda

class IsaacROSBaseNode(Node):
    def __init__(self, node_name, gpu_id=0):
        super().__init__(node_name)

        # Initialize GPU context
        self.gpu_id = gpu_id
        torch.cuda.set_device(gpu_id)
        self.device = torch.device(f'cuda:{gpu_id}')

        # Performance monitoring
        self.fps_counter = 0
        self.last_time = self.get_clock().now()

        # Configuration parameters
        self.declare_parameter('confidence_threshold', 0.5)
        self.declare_parameter('max_objects', 100)
        self.confidence_threshold = self.get_parameter('confidence_threshold').value
        self.max_objects = self.get_parameter('max_objects').value

    def gpu_memory_usage(self):
        """Get current GPU memory usage"""
        return torch.cuda.memory_allocated(self.device) / (1024**3)  # GB

    def update_performance_metrics(self):
        """Update performance metrics for monitoring"""
        current_time = self.get_clock().now()
        time_diff = (current_time - self.last_time).nanoseconds / 1e9  # seconds

        if time_diff >= 1.0:  # Update every second
            fps = self.fps_counter / time_diff
            self.get_logger().info(f'FPS: {fps:.2f}, GPU Memory: {self.gpu_memory_usage():.2f}GB')
            self.fps_counter = 0
            self.last_time = current_time
        else:
            self.fps_counter += 1
```

### 2. Object Detection Node Implementation

#### Object Detection Node Architecture
The object detection node processes images and identifies objects with bounding boxes and confidence scores:

```python
# object_detection_node.py
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from vision_msgs.msg import Detection2DArray, Detection2D, ObjectHypothesisWithPose
from builtin_interfaces.msg import Time
import numpy as np
import cv2
import torch
from torchvision import transforms
from isaac_ros_interfaces.msg import ObjectDetection2DArray

class ObjectDetectionNode(IsaacROSBaseNode):
    def __init__(self):
        super().__init__('object_detection_node')

        # Create publisher for detection results
        self.detection_publisher = self.create_publisher(
            ObjectDetection2DArray,
            '/perception/detections',
            10
        )

        # Create subscriber for camera images
        self.image_subscriber = self.create_subscription(
            Image,
            '/camera/image_raw',
            self.image_callback,
            10
        )

        # Load pre-trained model (YOLO-based)
        self.model = self.load_model()
        self.model.to(self.device)
        self.model.eval()

        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Resize((640, 640))
        ])

        self.get_logger().info('Object Detection Node initialized')

    def load_model(self):
        """Load pre-trained object detection model"""
        # Using a YOLO-based model for demonstration
        # In practice, this would be a TensorRT-optimized model
        import torchvision.models.detection as detection_models

        model = detection_models.fasterrcnn_resnet50_fpn(pretrained=True)
        return model

    def image_callback(self, msg):
        """Process incoming image and perform object detection"""
        # Convert ROS Image to OpenCV format
        image = self.ros_image_to_cv2(msg)

        # Preprocess image for model
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        # Perform inference
        with torch.no_grad():
            predictions = self.model(input_tensor)

        # Process predictions
        detections = self.process_predictions(predictions, image.shape)

        # Publish results
        self.publish_detections(detections, msg.header)

        # Update performance metrics
        self.update_performance_metrics()

    def ros_image_to_cv2(self, ros_image):
        """Convert ROS Image message to OpenCV image"""
        dtype = np.uint8
        if ros_image.encoding == 'rgb8':
            dtype = np.uint8
            cv2_image = np.frombuffer(ros_image.data, dtype=dtype).reshape(
                ros_image.height, ros_image.width, 3
            )
            # Convert RGB to BGR for OpenCV
            cv2_image = cv2.cvtColor(cv2_image, cv2.COLOR_RGB2BGR)
        elif ros_image.encoding == 'bgr8':
            cv2_image = np.frombuffer(ros_image.data, dtype=dtype).reshape(
                ros_image.height, ros_image.width, 3
            )
        else:
            raise ValueError(f'Unsupported image encoding: {ros_image.encoding}')

        return cv2_image

    def process_predictions(self, predictions, original_shape):
        """Process model predictions into detection format"""
        detections = []

        # Extract prediction data
        pred_boxes = predictions[0]['boxes'].cpu().numpy()
        pred_scores = predictions[0]['scores'].cpu().numpy()
        pred_labels = predictions[0]['labels'].cpu().numpy()

        # Apply confidence threshold
        valid_indices = pred_scores >= self.confidence_threshold

        for i in valid_indices.nonzero()[0]:
            if len(detections) >= self.max_objects:
                break

            box = pred_boxes[i]
            score = pred_scores[i]
            label = pred_labels[i]

            # Scale bounding box to original image size
            h_ratio = original_shape[0] / 640
            w_ratio = original_shape[1] / 640

            scaled_box = [
                box[0] * w_ratio,  # x_min
                box[1] * h_ratio,  # y_min
                box[2] * w_ratio,  # x_max
                box[3] * h_ratio   # y_max
            ]

            detection = {
                'bbox': scaled_box,
                'confidence': float(score),
                'class_id': int(label),
                'class_name': self.get_class_name(label)
            }

            detections.append(detection)

        return detections

    def get_class_name(self, class_id):
        """Map class ID to class name"""
        # COCO dataset class names
        coco_classes = [
            'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train',
            'truck', 'boat', 'traffic light', 'fire hydrant', 'stop sign',
            'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep',
            'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella',
            'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard',
            'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard',
            'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup', 'fork',
            'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
            'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
            'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv',
            'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave',
            'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase',
            'scissors', 'teddy bear', 'hair drier', 'toothbrush'
        ]

        if 0 <= class_id < len(coco_classes):
            return coco_classes[class_id]
        else:
            return f'unknown_{class_id}'

    def publish_detections(self, detections, header):
        """Publish detection results to ROS topic"""
        detection_msg = ObjectDetection2DArray()
        detection_msg.header = header

        for detection in detections:
            detection_2d = Detection2D()
            detection_2d.header = header

            # Set bounding box
            bbox = detection['bbox']
            detection_2d.bbox.center.x = (bbox[0] + bbox[2]) / 2.0
            detection_2d.bbox.center.y = (bbox[1] + bbox[3]) / 2.0
            detection_2d.bbox.size_x = abs(bbox[2] - bbox[0])
            detection_2d.bbox.size_y = abs(bbox[3] - bbox[1])

            # Set classification
            hypothesis = ObjectHypothesisWithPose()
            hypothesis.hypothesis.class_id = str(detection['class_id'])
            hypothesis.hypothesis.score = detection['confidence']
            detection_2d.results.append(hypothesis)

            detection_msg.detections.append(detection_2d)

        self.detection_publisher.publish(detection_msg)

def main(args=None):
    rclpy.init(args=args)
    node = ObjectDetectionNode()

    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
```

### 3. Classification Node Implementation

#### Classification Node Architecture
The classification node identifies the type of objects in images:

```python
# classification_node.py
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from vision_msgs.msg import Classification2DArray, Classification2D
from builtin_interfaces.msg import Time
import numpy as np
import cv2
import torch
import torchvision.transforms as transforms

class ClassificationNode(IsaacROSBaseNode):
    def __init__(self):
        super().__init__('classification_node')

        # Create publisher for classification results
        self.classification_publisher = self.create_publisher(
            Classification2DArray,
            '/perception/classifications',
            10
        )

        # Create subscriber for camera images
        self.image_subscriber = self.create_subscription(
            Image,
            '/camera/image_raw',
            self.image_callback,
            10
        )

        # Load pre-trained classification model
        self.model = self.load_model()
        self.model.to(self.device)
        self.model.eval()

        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                               std=[0.229, 0.224, 0.225])
        ])

        self.get_logger().info('Classification Node initialized')

    def load_model(self):
        """Load pre-trained classification model"""
        import torchvision.models as models

        # Using ResNet-50 for classification
        model = models.resnet50(pretrained=True)
        return model

    def image_callback(self, msg):
        """Process incoming image and perform classification"""
        # Convert ROS Image to OpenCV format
        image = self.ros_image_to_cv2(msg)

        # Preprocess image for model
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        # Perform inference
        with torch.no_grad():
            predictions = self.model(input_tensor)
            probabilities = torch.nn.functional.softmax(predictions[0], dim=0)

        # Get top classifications
        top_probs, top_classes = torch.topk(probabilities, k=5)

        # Process results
        classifications = self.process_classifications(
            top_probs.cpu().numpy(),
            top_classes.cpu().numpy()
        )

        # Publish results
        self.publish_classifications(classifications, msg.header)

        # Update performance metrics
        self.update_performance_metrics()

    def process_classifications(self, probabilities, class_ids):
        """Process classification results"""
        classifications = []

        for prob, class_id in zip(probabilities, class_ids):
            if prob >= self.confidence_threshold:
                classification = {
                    'class_id': int(class_id),
                    'confidence': float(prob),
                    'class_name': self.get_class_name(class_id)
                }
                classifications.append(classification)

        return classifications

    def publish_classifications(self, classifications, header):
        """Publish classification results to ROS topic"""
        classification_msg = Classification2DArray()
        classification_msg.header = header

        for classification in classifications:
            class_2d = Classification2D()
            class_2d.header = header
            class_2d.Classification.Class = str(classification['class_id'])
            class_2d.Classification.probability = classification['confidence']

            classification_msg.classifications.append(class_2d)

        self.classification_publisher.publish(classification_msg)

    def get_class_name(self, class_id):
        """Map ImageNet class ID to class name"""
        # Simplified ImageNet class mapping
        imagenet_classes = [
            "tench", "goldfish", "great_white_shark", "tiger_shark", "hammerhead",
            "electric_ray", "stingray", "cock", "hen", "ostrich", "brambling",
            "goldfinch", "house_finch", "junco", "indigo_bunting", "robin",
            "bulbul", "jay", "magpie", "chickadee", "water_ouzel", "kite",
            "bald_eagle", "vulture", "great_grey_owl", "European_fire_salamander",
            "common_newt", "eft", "spotted_salamander", "axolotl", "bullfrog",
            "tree_frog", "tailed_frog", "loggerhead", "leatherback_turtle",
            "mud_turtle", "terrapin", "box_turtle", "banded_gecko", "common_iguana",
            "American_chameleon", "whiptail", "agama", "frilled_lizard", "alligator_lizard",
            "Gila_monster", "green_lizard", "African_chameleon", "Komodo_dragon",
            "African_crocodile", "American_alligator", "triceratops", "thunder_snake",
            "ringneck_snake", "hognose_snake", "green_snake", "king_snake",
            "garter_snake", "water_snake", "vine_snake", "night_snake", "boa_constrictor",
            "rock_python", "Indian_cobra", "green_mamba", "sea_snake", "horned_viper",
            "diamondback", "sidewinder", "trilobite", "harvestman", "scorpion",
            "black_and_gold_garden_spider", "barn_spider", "garden_spider",
            "black_widow", "tarantula", "wolf_spider", "tick", "centipede",
            "black_grouse", "ptarmigan", "ruffed_grouse", "prairie_chicken",
            "peacock", "quail", "partridge", "African_grey", "macaw", "sulphur-crested_cockatoo",
            "lorikeet", "coucal", "bee_eater", "hornbill", "hummingbird", "jacamar",
            "toucan", "drake", "red-breasted_merganser", "goose", "black_swan",
            "tusker", "echidna", "platypus", "wallaby", "koala", "wombat",
            "jellyfish", "sea_anemone", "brain_coral", "flatworm", "nematode",
            "conch", "snail", "slug", "sea_slug", "chiton", "chambered_nautilus",
            "Dungeness_crab", "rock_crab", "fiddler_crab", "king_crab",
            "American_lobster", "spiny_lobster", "crayfish", "hermit_crab",
            "isopod", "white_stork", "black_stork", "spoonbill", "flamingo",
            "little_blue_heron", "American_egret", "bittern", "crane", "limpkin",
            "European_gallinule", "American_coot", "bustard", "ruddy_turnstone",
            "red-backed_sandpiper", "redshank", "dowitcher", "oystercatcher",
            "pelican", "king_penguin", "albatross", "grey_whale", "killer_whale",
            "dugong", "sea_lion", "Chihuahua", "Japanese_spaniel", "Maltese_dog",
            "Pekinese", "Shih-Tzu", "Blenheim_spaniel", "papillon", "toy_terrier",
            "Rhodesian_ridgeback", "Afghan_hound", "basset", "beagle", "bloodhound",
            "bluetick", "black-and-tan_coonhound", "Walker_hound", "English_foxhound",
            "redbone", "borzoi", "Irish_wolfhound", "Italian_greyhound",
            "whippet", "Ibizan_hound", "Norwegian_elkhound", "otterhound",
            "Saluki", "Scottish_deerhound", "Weimaraner", "Staffordshire_bullterrier",
            "American_Staffordshire_terrier", "Bedlington_terrier", "Border_terrier",
            "Kerry_blue_terrier", "Irish_terrier", "Norfolk_terrier",
            "Norwich_terrier", "Yorkshire_terrier", "wire-haired_fox_terrier",
            "Lakeland_terrier", "Sealyham_terrier", "Airedale", "cairn",
            "Australian_terrier", "Dandie_Dinmont", "Boston_bull", "miniature_schnauzer",
            "giant_schnauzer", "standard_schnauzer", "Scotch_terrier", "Tibetan_terrier",
            "silky_terrier", "soft-coated_wheaten_terrier", "West_Highland_white_terrier",
            "Lhasa", "flat-coated_retriever", "curly-coated_retriever",
            "golden_retriever", "Labrador_retriever", "Chesapeake_Bay_retriever",
            "German_short-haired_pointer", "vizsla", "English_setter", "Irish_setter",
            "Gordon_setter", "Brittany_spaniel", "clumber", "English_springer",
            "Welsh_springer_spaniel", "cocker_spaniel", "Sussex_spaniel",
            "Irish_water_spaniel", "kuvasz", "schipperke", "groenendael",
            "malinois", "briard", "kelpie", "komondor", "Old_English_sheepdog",
            "Shetland_sheepdog", "collie", "Border_collie", "Bouvier_des_Flandres",
            "Rottweiler", "German_shepherd", "Doberman", "miniature_pinscher",
            "Greater_Swiss_Mountain_dog", "Bernese_mountain_dog", "Appenzeller",
            "EntleBucher", "boxer", "bull_mastiff", "Tibetan_mastiff", "French_bulldog",
            "Great_Dane", "Saint_Bernard", "Eskimo_dog", "malamute", "Siberian_husky",
            "dalmatian", "affenpinscher", "basenji", "pug", "Leonberg", "Newfoundland",
            "Great_Pyrenees", "Samoyed", "Pomeranian", "chow", "keeshond",
            "Brabancon_griffon", "Pembroke", "Cardigan", "toy_poodle",
            "miniature_poodle", "standard_poodle", "Mexican_hairless", "timber_wolf",
            "white_wolf", "red_wolf", "coyote", "dingo", "dhole", "African_hunting_dog",
            "hyena", "red_fox", "kit_fox", "Arctic_fox", "grey_fox", "tabby",
            "tiger_cat", "Persian_cat", "Siamese_cat", "Egyptian_cat", "cougar",
            "lynx", "leopard", "snow_leopard", "jaguar", "lion", "tiger",
            "cheetah", "brown_bear", "American_black_bear", "ice_bear", "sloth_bear",
            "mongoose", "meerkat", "tiger_beetle", "ladybug", "ground_beetle",
            "long-horned_beetle", "leaf_beetle", "dung_beetle", "rhinoceros_beetle",
            "weevil", "fly", "bee", "ant", "grasshopper", "cricket", "walking_stick",
            "cockroach", "mantis", "cicada", "leafhopper", "lacewing", "dragonfly",
            "damselfly", "admiral", "ringlet", "monarch", "cabbage_butterfly",
            "sulphur_butterfly", "lycaenid", "starfish", "sea_urchin", "sea_cucumber",
            "wood_rabbit", "hare", "Angora", "hamster", "porcupine", "fox_squirrel",
            "marmot", "beaver", "guinea_pig", "sorrel", "zebra", "hog", "wild_boar",
            "warthog", "hippopotamus", "ox", "water_buffalo", "bison", "ram",
            "bighorn", "ibex", "hartebeest", "impala", "gazelle", "Arabian_camel",
            "llama", "weasel", "mink", "polecat", "black-footed_ferret",
            "otter", "skunk", "badger", "armadillo", "three-toed_sloth",
            "orangutan", "gorilla", "chimpanzee", "gibbon", "siamang", "guenon",
            "patas", "baboon", "macaque", "langur", "colobus", "proboscis_monkey",
            "marmoset", "capuchin", "howler_monkey", "titi", "spider_monkey",
            "squirrel_monkey", "Madagascar_cat", "indri", "Indian_elephant",
            "African_elephant", "lesser_panda", "giant_panda", "barracouta",
            "eel", "coho", "rock_beauty", "anemone_fish", "sturgeon", "gar",
            "lionfish", "puffer"
        ]

        if 0 <= class_id < len(imagenet_classes):
            return imagenet_classes[class_id]
        else:
            return f'unknown_{class_id}'
```

### 4. GPU Acceleration Utilities

#### GPU Processing Pipeline
```python
# gpu_processing.py
import torch
import numpy as np
import cv2
from typing import List, Tuple, Dict, Any

class GPUProcessingPipeline:
    def __init__(self, gpu_id: int = 0):
        self.gpu_id = gpu_id
        torch.cuda.set_device(gpu_id)
        self.device = torch.device(f'cuda:{gpu_id}')

        # Memory management
        self.max_memory_usage = 0.8  # 80% of available memory
        self.memory_warning_threshold = 0.9  # 90% of available memory

    def optimize_tensor_memory(self, tensor: torch.Tensor) -> torch.Tensor:
        """Optimize tensor for GPU memory usage"""
        # Ensure tensor is on the correct device
        tensor = tensor.to(self.device)

        # Optimize data type if possible
        if tensor.dtype == torch.float64:
            tensor = tensor.float()  # Convert to float32

        return tensor

    def batch_process_images(self, images: List[np.ndarray]) -> torch.Tensor:
        """Process a batch of images on GPU"""
        # Convert images to tensors
        tensors = []
        for img in images:
            # Convert to tensor and normalize
            tensor = torch.from_numpy(img).float().permute(2, 0, 1) / 255.0
            tensors.append(tensor)

        # Stack into batch
        batch_tensor = torch.stack(tensors).to(self.device)

        return batch_tensor

    def memory_monitoring(self) -> Dict[str, float]:
        """Monitor GPU memory usage"""
        memory_allocated = torch.cuda.memory_allocated(self.device) / (1024**3)  # GB
        memory_reserved = torch.cuda.memory_reserved(self.device) / (1024**3)    # GB
        total_memory = torch.cuda.get_device_properties(self.device).total_memory / (1024**3)  # GB

        memory_usage = {
            'allocated_gb': memory_allocated,
            'reserved_gb': memory_reserved,
            'total_gb': total_memory,
            'utilization': memory_allocated / total_memory if total_memory > 0 else 0
        }

        # Check for memory issues
        if memory_usage['utilization'] > self.memory_warning_threshold:
            print(f"WARNING: GPU memory utilization is {memory_usage['utilization']:.2%}")

        return memory_usage

    def cleanup_memory(self):
        """Clean up GPU memory"""
        torch.cuda.empty_cache()
        torch.cuda.synchronize(self.device)
```

### 5. Performance Monitoring

#### Performance Metrics Collection
```python
# performance_metrics.py
import time
from typing import Dict, List, Optional
import numpy as np

class PerformanceMetrics:
    def __init__(self):
        self.fps_history = []
        self.processing_times = []
        self.memory_usage_history = []
        self.start_time = None

    def start_timer(self):
        """Start timing for a processing operation"""
        self.start_time = time.time()

    def end_timer(self):
        """End timing and record processing time"""
        if self.start_time:
            elapsed_time = time.time() - self.start_time
            self.processing_times.append(elapsed_time)
            self.start_time = None
            return elapsed_time
        return None

    def record_fps(self, fps: float):
        """Record FPS value"""
        self.fps_history.append(fps)

    def record_memory_usage(self, memory_gb: float):
        """Record memory usage"""
        self.memory_usage_history.append(memory_gb)

    def get_current_metrics(self) -> Dict[str, float]:
        """Get current performance metrics"""
        if not self.processing_times:
            return {}

        avg_processing_time = np.mean(self.processing_times[-10:])  # Last 10 samples
        avg_fps = np.mean(self.fps_history[-10:]) if self.fps_history else 0
        avg_memory = np.mean(self.memory_usage_history[-10:]) if self.memory_usage_history else 0

        return {
            'avg_processing_time_ms': avg_processing_time * 1000,
            'avg_fps': avg_fps,
            'avg_memory_gb': avg_memory,
            'min_processing_time_ms': min(self.processing_times) * 1000,
            'max_processing_time_ms': max(self.processing_times) * 1000,
            'current_fps': self.fps_history[-1] if self.fps_history else 0
        }

    def reset(self):
        """Reset all metrics"""
        self.fps_history = []
        self.processing_times = []
        self.memory_usage_history = []
```

### 6. Debugging Tips

#### Common Issues and Solutions
1. **GPU Memory Issues**:
   - Reduce batch size
   - Use mixed precision training
   - Clear GPU cache periodically

2. **Low Performance**:
   - Check GPU utilization
   - Optimize data loading pipeline
   - Use TensorRT for inference optimization

3. **Model Accuracy Issues**:
   - Validate input preprocessing
   - Check model calibration
   - Verify data format compatibility

#### Performance Debugging
```bash
# Monitor GPU usage
nvidia-smi -l 1

# Check ROS 2 performance
ros2 topic hz /camera/image_raw
ros2 topic hz /perception/detections

# Monitor node performance
ros2 run isaac_ros_perceptor performance_monitor
```

### Expected Output
When completing this topic, students should have:
- A functional Isaac ROS object detection node
- A classification node with GPU acceleration
- Performance metrics showing 30+ FPS processing
- Proper ROS 2 topic integration
- Validated perception outputs with confidence scores

### Next Steps
After completing this topic, students will be prepared to move to Topic 3: VSLAM and Navigation, where they will learn to integrate perception with navigation systems for autonomous robot movement.