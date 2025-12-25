import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

if (ExecutionEnvironment.canUseDOM) {
  // Dynamically import and render the Chatbot component to avoid SSR issues
  import('@site/src/components/Chatbot').then(ChatbotModule => {
    // Handle different module formats
    const ChatbotComponent = ChatbotModule.default || ChatbotModule;

    // Ensure we have a valid component function
    if (ChatbotComponent && typeof ChatbotComponent === 'function') {
      // Create a container for the chatbot
      const chatbotContainer = document.createElement('div');
      chatbotContainer.id = 'chatbot-container';
      document.body.appendChild(chatbotContainer);

      // Import React DOM and render the component
      import('react-dom/client').then(ReactDOMModule => {
        if (typeof ReactDOMModule.createRoot === 'function') {
          const root = ReactDOMModule.createRoot(chatbotContainer);
          // Use React.createElement to ensure proper rendering
          const React = require('react');
          root.render(React.createElement(ChatbotComponent));
        }
      }).catch(err => {
        console.error('Failed to load react-dom/client:', err);
      });
    } else {
      console.error('Chatbot component is not a valid function:', typeof ChatbotComponent);
    }
  }).catch(err => {
    console.error('Failed to load Chatbot component:', err);
  });
}