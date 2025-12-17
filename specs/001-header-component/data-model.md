# Data Model: Header Component

## Component Structure

### Header Component
- **Props**:
  - `title` (string, optional): Main heading text for the header
  - `subtitle` (string, optional): Subheading text
  - `description` (string, optional): Description text about AI and robotics
  - `ctaText` (string, optional): Call-to-action button text
  - `ctaUrl` (string, optional): URL for the CTA button
  - `imageSrc` (string, optional): Source path for the robotics image (defaults to /img/robotics.png)
  - `imageAlt` (string, optional): Alt text for the image (defaults to "Robotics AI Book")

### Internal State
- `isHovered` (boolean): Tracks hover state for CTA button effects
- `imageLoaded` (boolean): Tracks whether the image has loaded successfully

## UI Elements

### Left Content Section
- **Heading**: Main title (h1 or h2 depending on context)
- **Subheading**: Secondary text (optional)
- **Description**: Paragraph text about AI and robotics
- **CTA Button**: Optional call-to-action with hover effect

### Right Image Section
- **Image**: Robotics-related image with vertical centering
- **Fallback**: Alt text and potential error state display

## Responsive Breakpoints
- **Mobile** (<640px): Stacked layout (image below content)
- **Tablet** (640px-1024px): Side-by-side with adjusted spacing
- **Desktop** (>1024px): Full side-by-side layout with optimal spacing

## Accessibility Features
- Semantic HTML structure (header element, proper heading hierarchy)
- ARIA labels for interactive elements
- Keyboard navigation support
- Sufficient color contrast (4.5:1 minimum)
- Screen reader compatibility