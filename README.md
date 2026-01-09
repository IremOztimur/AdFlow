# AdFlow - Visual Workflow Builder

A node-based visual workflow builder for generating image ads.

## Features
- **Visual Interface**: Drag-and-drop node editor using React Flow.
- **Node Types**:
  - **Input**: Define text or image sources.
  - **Prompt Builder**: Combine inputs using handlebars syntax (e.g., `{{Product Name}}`).
  - **Model Selector**: Choose between DALL-E 3, DALL-E 2.
  - **Output Gallery**: View generated results.
- **Persistence**: Workflows and API keys are saved locally in the browser.
- **Real & Mock Modes**: Works with OpenAI API Key (Client-side) or falls back to mock generation for testing.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React Flow (@xyflow/react), Shadcn UI, Tailwind CSS
- **State Management**: Zustand (with local storage persistence)
- **Icons**: Lucide React

## Setup & Run
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

## Approach
- **State Management**: Zustand was chosen for its simplicity and ease of use with React Flow, especially for handling complex nested object updates (nodes/edges).
- **Execution Logic**: The "Run" button triggers a graph traversal starting from Output nodes, resolving dependencies backwards. This ensures that even complex flows are resolved correctly.
- **Component Design**: Custom nodes are built using Shadcn Cards for a consistent, professional "dark mode" aesthetic.
- **Node Positioning**: Implemented a smart overlap detection system that accounts for variable node widths (like the wider Prompt Node) and uses a grid-search strategy to find the optimal clear space for new nodes.

## Tradeoffs
- **Client-Side API Calls**: For this MVP, the OpenAI and Gemini APIs are called directly from the browser. In a production app, this would be routed through a backend proxy to secure the API key.
- **Prompt Complexity**: The current prompt builder uses simple string replacement. While we added a Gemini-powered "Optimize" button, a production version could include a more interactive, chat-based refinement loop.
- **UI Scaling**: While the canvas is infinite, the current overlapping logic has a limit (50 attempts). In extremely dense graphs, manual adjustment might still be needed.

## Future Improvements (Roadmap)
- **Containerization**: Dockerize the project for easier deployment and consistent environments.
- **Logo Integration**: Add a dedicated input type or post-processing step to overlay brand logos on generated ads.
- **Advanced Inputs**: Support multiple product images to create composite scenes or maintain consistency across angles.
- **High-Fidelity Models**: Integrate `gpt-image-1.5` or similar advanced models to better preserve input details (product fidelity) in the final output.
- **Iterative Optimization**: Improve the Prompt Optimizer to allow for multi-turn refinement (user feedback loop) rather than a one-off suggestion.
- **Image Editing**: Add an in-browser editor (crop, mask, text overlay) to refine generated images before downloading.
- **Backend Execution**: Move generation logic to a serverless function.

---
Built by Irem Oztimur.
