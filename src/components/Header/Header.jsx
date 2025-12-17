import React from "react";
import "../../css/custom.css"; // Correct path to your custom CSS
import headerImage from "@site/static/img/header1.png"; // Import the image

const Header = ({
  title = "Physical AI & Humanoid Robotics",
  subtitle = "Bridging AI Intelligence with Real-World Humanoid Robotics",
  description = "Explore the intersection of robotics and artificial intelligence through comprehensive guides, step-by-step tutorials, and hands-on projects. Learn to design, simulate, and control humanoid robots, applying advanced AI techniques to bring intelligent machines to life in real-world environments.",
  ctaText = "Read the Book",
  ctaUrl = "/docs/intro",
  imageUrl = headerImage, // Use the imported image
}) => {
  return (
    <header className="header-container bg-gradient-to-r from-blue-800 via-blue-500 to-blue-900 text-white min-h-[500px] flex items-center justify-center p-12 box-border">
      <div className="header-content flex flex-row items-center justify-between max-w-6xl w-full gap-5">
        <div className="header-left flex-1">
          <h1 className="header-title text-5xl font-bold mb-5">{title}</h1>
          <p className="header-subtitle text-xl text-blue-100 mb-4">
            {subtitle}
          </p>
          <p className="header-description text-lg mb-6 leading-relaxed">
            {description}
          </p>
          <a
            href={ctaUrl}
            className="header-button inline-block bg-white text-blue-700 font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:bg-blue-100 hover:text-blue-900"
          >
            {ctaText}
          </a>
        </div>
        <div className="header-right flex-1 flex justify-center">
          <img
            src={imageUrl}
            alt="Header Visual"
            className="header-image max-w-full h-auto rounded-xl object-contain border-2 border-white"
            onError={(e) => {
              console.error("Header image failed to load:", e.target.src);
              e.target.style.display = "none";
              e.target.parentElement.innerHTML =
                '<div class="bg-gray-200 border-2 border-dashed rounded-xl w-full h-64 flex items-center justify-center text-gray-500">Image failed to load</div>';
            }}
            onLoad={(e) => {
              console.log("Header image loaded successfully:", e.target.src);
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
