import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Chatbot from '@site/src/components/Chatbot';

if (ExecutionEnvironment.canUseDOM) {
  // Create a container for the chatbot
  const chatbotContainer = document.createElement('div');
  chatbotContainer.id = 'chatbot-container';
  document.body.appendChild(chatbotContainer);

  // Render the chatbot component using React DOM
  const root = createRoot(chatbotContainer);
  root.render(<Chatbot />);
}