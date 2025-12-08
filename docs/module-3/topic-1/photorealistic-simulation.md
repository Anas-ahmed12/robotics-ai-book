# Module 3: AI-Robot Brain (NVIDIA Isaac™)
## Topic 1: Photorealistic Simulation in Isaac Sim

### Overview
This topic introduces students to NVIDIA Isaac Sim, a powerful simulation environment that enables the creation of photorealistic scenes for robotics training and testing. Isaac Sim provides synthetic dataset generation capabilities that are essential for training perception models without requiring expensive real-world data collection.

### Learning Objectives
By the end of this topic, students will be able to:
1. Install and configure NVIDIA Isaac Sim
2. Create photorealistic simulation scenes with various objects and lighting conditions
3. Generate synthetic datasets with proper annotations
4. Optimize rendering performance for real-time simulation
5. Validate synthetic datasets for use in perception training

### Prerequisites
- NVIDIA RTX 3060 or equivalent GPU with CUDA support
- Ubuntu 22.04 LTS
- ROS 2 Humble Hawksbill installed
- NVIDIA Isaac Sim license and installation

### 1. Isaac Sim Installation and Setup

#### System Requirements Check
Before installing Isaac Sim, verify your system meets the requirements:

```bash
# Check GPU capabilities
nvidia-smi

# Verify CUDA installation
nvcc --version

# Check available VRAM (minimum 8GB recommended)
nvidia-smi --query-gpu=memory.total --format=csv
```

#### Isaac Sim Installation
1. Download Isaac Sim from NVIDIA Developer website
2. Extract and run the installation script:
```bash
tar -xzf isaac_sim-*.tar.gz
cd isaac_sim-*
./isaac-sim.filenode --no-localhost
```

### 2. Creating Photorealistic Simulation Scenes

#### Basic Scene Structure
An Isaac Sim scene consists of:
- Environment geometry and textures
- Lighting configuration
- Physical objects with properties
- Sensor placements
- Physics parameters

#### Scene Configuration Example
```python
# Example: Creating a basic indoor scene
import omni
from omni.isaac.core import World
from omni.isaac.core.utils.stage import add_reference_to_stage
from omni.isaac.core.utils.prims import create_prim
from omni.isaac.core.utils.carb import set_carb_setting

# Initialize Isaac Sim world
world = World(stage_units_in_meters=1.0)

# Add environment (e.g., warehouse, room)
add_reference_to_stage(
    usd_path="/Isaac/Environments/Simple_Room/simple_room.usd",
    prim_path="/World/SimpleRoom"
)

# Add objects with realistic properties
create_prim(
    prim_path="/World/Cube",
    prim_type="Cube",
    position=[0.5, 0.5, 0.5],
    attributes={"size": 0.2}
)

# Configure lighting
create_prim(
    prim_path="/World/Light",
    prim_type="DistantLight",
    position=[0, 0, 5],
    attributes={"color": [0.8, 0.8, 0.8]}
)
```

### 3. Synthetic Dataset Generation

#### Dataset Configuration Parameters
- **Object Variations**: Different shapes, colors, textures
- **Lighting Conditions**: Various intensities, angles, colors
- **Camera Positions**: Multiple viewpoints for comprehensive coverage
- **Annotation Formats**: COCO, YOLO, Pascal VOC for different ML frameworks

#### Example: Dataset Generation Script
```python
# dataset_generation.py
import omni
from omni.isaac.core import World
import numpy as np
import cv2
import json
from pathlib import Path

class SyntheticDatasetGenerator:
    def __init__(self, scene_config, output_dir):
        self.scene_config = scene_config
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)

    def generate_scene_variations(self, num_samples=1000):
        """Generate multiple scene variations for dataset"""
        for i in range(num_samples):
            # Randomize object positions and properties
            self.randomize_scene()

            # Capture RGB, depth, and segmentation data
            rgb_image = self.capture_rgb()
            depth_image = self.capture_depth()
            segmentation = self.capture_segmentation()

            # Generate annotations
            annotations = self.generate_annotations()

            # Save data with consistent naming
            self.save_sample(i, rgb_image, depth_image, segmentation, annotations)

            # Reset for next sample
            self.reset_scene()

    def generate_annotations(self):
        """Generate COCO format annotations for current scene"""
        annotations = {
            "info": {
                "description": "Synthetic dataset for object detection",
                "version": "1.0",
                "year": 2025
            },
            "images": [],
            "annotations": [],
            "categories": []
        }
        # Implementation details for annotation generation
        return annotations

# Usage example
generator = SyntheticDatasetGenerator(
    scene_config="config/indoor_scene.json",
    output_dir="datasets/synthetic_objects"
)
generator.generate_scene_variations(num_samples=1000)
```

### 4. Performance Optimization

#### Rendering Performance Monitoring
```python
# performance_monitor.py
import omni
import carb

class RenderingPerformanceMonitor:
    def __init__(self):
        self.fps_samples = []

    def get_rendering_metrics(self):
        """Get current rendering performance metrics"""
        appwindow = omni.appwindow.get_default_app_window()
        width, height = appwindow.get_size()

        # Get FPS from Isaac Sim
        timeline = omni.timeline.get_timeline_interface()
        current_time = timeline.get_current_time()

        # Get GPU metrics
        gpu_metrics = carb.settings.get_settings().get("/renderer/profiling/gpu")

        return {
            "fps": carb.profiling.get_profiler().get_average_fps(),
            "resolution": {"width": width, "height": height},
            "gpu_utilization": gpu_metrics.get("utilization", 0) if gpu_metrics else 0,
            "memory_usage": gpu_metrics.get("memory_used", 0) if gpu_metrics else 0
        }

    def optimize_rendering(self, target_fps=30):
        """Adjust rendering settings to maintain target FPS"""
        # Reduce rendering quality if FPS is too low
        if self.get_rendering_metrics()["fps"] < target_fps * 0.8:
            carb.settings.get_settings().set("/persistent/isaac/scene_cache/enable", False)
            carb.settings.get_settings().set("/rtx/indirectdiffuse/maxTracingLuminousMeshLightCount", 50)
```

### 5. Quality Validation

#### Dataset Quality Metrics
- **Visual Quality**: Consistency of lighting, textures, and shadows
- **Annotation Accuracy**: Proper bounding boxes and class labels
- **Diversity**: Range of object positions, lighting conditions, and backgrounds
- **Reproducibility**: Ability to generate consistent datasets

#### Validation Example
```python
# validation.py
import cv2
import numpy as np
from pathlib import Path

class DatasetValidator:
    def __init__(self, dataset_path):
        self.dataset_path = Path(dataset_path)

    def validate_visual_quality(self):
        """Validate visual quality of generated images"""
        images = list(self.dataset_path.glob("*.jpg"))
        quality_scores = []

        for img_path in images:
            img = cv2.imread(str(img_path))
            # Calculate image quality metrics
            sharpness = self.calculate_sharpness(img)
            brightness = self.calculate_brightness(img)
            contrast = self.calculate_contrast(img)

            quality_scores.append({
                "sharpness": sharpness,
                "brightness": brightness,
                "contrast": contrast
            })

        return quality_scores

    def calculate_sharpness(self, image):
        """Calculate image sharpness using Laplacian variance"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        return laplacian_var

    def calculate_brightness(self, image):
        """Calculate average brightness of image"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        return np.mean(gray)

    def calculate_contrast(self, image):
        """Calculate contrast of image"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        return np.std(gray)
```

### 6. Debugging Tips

#### Common Issues and Solutions
1. **Low Rendering FPS**:
   - Reduce scene complexity
   - Lower texture resolution
   - Adjust lighting calculations

2. **Inconsistent Annotations**:
   - Verify object detection in scene
   - Check coordinate system alignment
   - Validate annotation format

3. **Memory Issues**:
   - Process data in batches
   - Clear GPU memory between samples
   - Use lower resolution during development

#### Performance Debugging
```bash
# Monitor GPU usage during simulation
nvidia-smi -l 1

# Check Isaac Sim logs
tail -f ~/isaac_sim/logs/isaac_sim.log
```

### Expected Output
When completing this topic, students should have:
- A functional Isaac Sim environment
- Multiple photorealistic scenes with varying configurations
- A synthetic dataset with proper annotations (COCO format)
- Performance metrics showing 30+ FPS rendering
- Validated dataset quality metrics

### Next Steps
After completing this topic, students will be prepared to move to Topic 2: Isaac ROS Nodes, where they will learn to interface their simulated data with real ROS 2 nodes for perception processing.