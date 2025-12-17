import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';

describe('Header Component', () => {
  it('renders with default props', () => {
    render(<Header />);

    expect(screen.getByText('Robotics & AI Book')).toBeInTheDocument();
    expect(screen.getByText('Understanding the Robotic Nervous System')).toBeInTheDocument();
    expect(screen.getByText('Explore the intersection of robotics and artificial intelligence with comprehensive guides and tutorials.')).toBeInTheDocument();
    expect(screen.getByText('Read the Book')).toBeInTheDocument();
  });

  it('renders with custom props', () => {
    render(
      <Header
        title="Custom Title"
        subtitle="Custom Subtitle"
        description="Custom Description"
        ctaText="Custom CTA"
        ctaUrl="/custom-url"
        imageSrc="/test-image.svg"
        imageAlt="Custom Alt Text"
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Custom Description')).toBeInTheDocument();
    expect(screen.getByText('Custom CTA')).toBeInTheDocument();
  });

  it('renders without CTA button when ctaText is empty', () => {
    render(<Header ctaText="" />);

    expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
  });

  it('renders with correct image alt text', () => {
    render(<Header imageAlt="Test Alt" imageSrc="/test-image.svg" />);

    const img = screen.getByAltText('Test Alt');
    expect(img).toBeInTheDocument();
  });

  it('has correct ARIA attributes for accessibility', () => {
    render(<Header />);

    const headerElement = screen.getByRole('banner');
    expect(headerElement).toBeInTheDocument();
  });
});