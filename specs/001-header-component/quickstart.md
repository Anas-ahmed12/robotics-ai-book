# Quickstart Guide: Header Component

## Prerequisites
- Node.js 16+ installed
- Docusaurus project already set up
- Tailwind CSS configured in your Docusaurus project

## Installation Steps

### 1. Create the component directory
```bash
mkdir -p src/components/Header
```

### 2. Add the robotics image
```bash
# Place the robotics.png image in the static directory
cp path/to/robotics.png static/img/robotics.png
```

### 3. Create the Header component
Create `src/components/Header/Header.jsx` with the implementation.

### 4. Import and use the component
In your Docusaurus layout or page:
```javascript
import Header from '@site/src/components/Header/Header';

// Use in your layout
<Header
  title="Robotics & AI Book"
  subtitle="Advanced Concepts in Artificial Intelligence"
  description="Exploring the frontier of robotics and artificial intelligence"
  ctaText="Get Started"
  ctaUrl="/docs/intro"
/>
```

## Development Commands
```bash
# Start development server
npm start

# Build the site
npm run build

# Run tests for the component
npm run test Header.test.js
```

## Configuration Options
- `title`: Main heading text (optional)
- `subtitle`: Subheading text (optional)
- `description`: Description paragraph (optional)
- `ctaText`: Call-to-action button text (optional)
- `ctaUrl`: URL for the CTA button (optional)
- `imageSrc`: Custom image source (defaults to /img/robotics.png)
- `imageAlt`: Custom alt text (defaults to "Robotics AI Book")

## Testing
Run the component tests to ensure all functionality works:
```bash
npm run test -- --testPathPattern=Header
```

## Verification
After implementation, verify:
1. Header displays with two portions (left content, right image)
2. Blue and white color theme is applied
3. Responsive behavior works on mobile, tablet, and desktop
4. CTA button has hover effect
5. All accessibility features are working
6. Image loads correctly and has fallback handling