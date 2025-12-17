import React from "react";
import clsx from "clsx";
import styles from "./HomepageFeatures.module.css";

const FeatureList = [
  {
    title: "The Robotic Nervous System (ROS 2)",
    Image: require("@site/static/img/module1.png").default,
    description: (
      <>
        Get started with ROS 2, the backbone of modern robotic control. Learn to
        manage robots with Nodes, Topics, and Services, integrate Python agents,
        and explore humanoid robot structures through URDF.
      </>
    ),
  },
  {
    title: "Advanced Robot Control & ROS 2 Integration",
    Image: require("@site/static/img/module5.png").default,
    description: (
      <>
        Dive into advanced robot control using ROS 2. Learn to integrate
        sensors, implement autonomous behaviors, and write Python scripts for
        real-time, intelligent robot coordination.
      </>
    ),
  },
  {
    title: "Robotics Perception & AI Integration",
    Image: require("@site/static/img/module3.png").default,
    description: (
      <>
        Explore how robots perceive their environment using sensors and AI.
        Learn to process data, implement computer vision, and enable intelligent
        decision-making for autonomous tasks.
      </>
    ),
  },
  {
    title: "Autonomous Robotics & Real-World Applications",
    Image: require("@site/static/img/module4.png").default,
    description: (
      <>
        Apply your robotics skills to real-world scenarios. Design fully
        autonomous systems, integrate multiple modules, and deploy intelligent
        robots for practical tasks and challenges.
      </>
    ),
  },
];

function Feature({ Svg, Image, title, description }) {
  return (
    <div className={clsx("col col--6")}>
      <div className={styles.featureCard}>
        <div className="text--center">
          {Svg ? (
            <Svg className={styles.featureSvg} role="img" />
          ) : Image ? (
            <img
              src={Image}
              className={styles.featureSvg}
              role="img"
              alt={title}
            />
          ) : null}
        </div>

        <div className="text--center padding-horiz--md">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">

        {/* 🔥 SECTION HEADING (boxes ke TOP pe) */}
        <h2 className={styles.sectionHeading}>
          What This Book Covers
        </h2>
        {/* 🔹 Subheading / small line */}
        <p className={styles.sectionSubheading}>
          Explore the core modules that guide you from basics to advanced robotics.
        </p>

        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>

      </div>
    </section>
  );
}
