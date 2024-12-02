# SimLab: Simple Simulation Laboratory 🧪

[![Main Repo](https://img.shields.io/badge/Main_Repo-SimLab-black?style=flat&logo=github)](https://github.com/Royaltyprogram/SimLab)
[![Website](https://img.shields.io/badge/website-simlab.info-blue?style=flat&logo=internet-explorer)](https://simlabapp.com)
[![Twitter Follow](https://img.shields.io/badge/follow-%40SimLab__official-1DA1F2?logo=twitter&style=flat)](https://twitter.com)

[![React](https://img.shields.io/badge/React-18.0.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7.0-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![KaTeX](https://img.shields.io/badge/KaTeX-0.16.9-yellow?logo=latex&logoColor=white)](https://katex.org/)
[![React Router](https://img.shields.io/badge/React_Router-6.20.0-CA4245?logo=react-router&logoColor=white)](https://reactrouter.com/)
[![Lucide Icons](https://img.shields.io/badge/Lucide_Icons-0.294.0-gray?logo=lucide&logoColor=white)](https://lucide.dev/)

SimLab is an internet laboratory where anyone can freely add and share their desired simulations. It's a platform that helps make scientific and mathematical concepts easier to understand through interactive, visual demonstrations.

## 🌟 About SimLab

SimLab aims to:
- Provide interactive visualizations of scientific and mathematical concepts
- Make complex ideas more approachable through hands-on simulations
- Offer a platform where anyone can share their educational simulations
- Build a collection of high-quality, web-based learning tools

## 🎯 Key Features

- **Interactive Simulations**: Visual demonstrations of various scientific and mathematical concepts
- **Modern UI**: Clean, responsive design that works across all devices
- **Real-time Updates**: Immediate visual feedback for parameter adjustments
- **Contributor System**: Simple process for adding new simulations
- **Firebase Backend**: Reliable infrastructure for simulation management and analytics

## 🧪 Testing Your Simulation

Before submitting your simulation, you can test it locally using the provided test app in the repository:

1. Navigate to the `testapp` directory
2. Place your simulation code in `YourSimulation.jsx`
3. In `App.js`, update the imports and component usage:

```jsx
// App.js
import YourSimulation from './YourSimulation'; // Update import

function App() {
  return (
    <div className="App">
      <YourSimulation /> {/* Replace TemplateSimulation with your component */}
    </div>
  );
}
```

4. Run the test app to verify your simulation works correctly:
```bash
cd testapp
npm install
npm start
```

This will allow you to test your simulation in isolation and ensure it functions properly before submitting your contribution.

## 👥 Contributing Simulations

Anyone can add new simulations to SimLab! To contribute:

1. Fork the repository
2. Reference the `TemplateSimulation` and `ExampleSimulation` folders to understand the structure
3. Create your simulation component and its metadata JSON file
4. Submit a Pull Request
5. After review and approval, your simulation will be added to SimLab

The repository provides template files and examples to help you get started. You'll need to create both the simulation component and a metadata file that includes information about your simulation.

### Simulation Requirements

Your simulation should:
- Be interactive and educational
- Work responsively across different screen sizes
- Include clear instructions and explanations
- Use React and follow our code style
- Be well-documented with comments

### Adding Your Simulation

You can contribute by referring to the `TemplateSimulation` and `ExampleSimulation` folders in the repository. Each simulation contribution should include:

1. **Simulation Component File** (`YourSimulation.jsx`):
```jsx
const YourSimulation = () => {
  // Your simulation logic
  return (
    <div className="simulation-container">
      {/* Your simulation JSX */}
    </div>
  );
};

export default YourSimulation;
```

2. **Metadata File** (`simulation.json`):
```json
{
  "componentName": "YourSimulation",
  "contributorGithub": "your-github-username",
  "contributorImage": "https://avatars.githubusercontent.com/u/your-id?v=4&size=64",
  "createdAt": 0,
  "description": "Detailed description in markdown format converted to string",
  "githubRepo": "your-github-username/SimLab",
  "likes": 0,
  "name": "Your Simulation Name",
  "simulationFilename": "YourSimulation",
  "thumbnailPath": "path/to/thumbnail/image",
  "updatedAt": 0,
  "views": 0
}
```

**Metadata Fields Explanation:**
- `componentName`: Name of your React component
- `contributorGithub`: Your GitHub username
- `contributorImage`: URL to your GitHub profile picture
- `createdAt`: Leave as 0 (will be set automatically)
- `description`: Markdown string explaining your simulation
- `githubRepo`: Your GitHub repository path
- `likes`: Leave as 0 (will be updated automatically)
- `name`: Display name of your simulation
- `simulationFilename`: Name of your simulation file without extension
- `thumbnailPath`: Path to your simulation's thumbnail
- `updatedAt`: Leave as 0 (will be updated automatically)
- `views`: Leave as 0 (will be tracked automatically)

Note: For the `description` field, provide your explanation as a markdown string. This allows for rich formatting including:
- Mathematical equations using KaTeX
- Code blocks
- Lists and tables
- Images and diagrams

Example markdown structure:
```markdown
# Simulation Title

## Introduction
Brief overview of the concept...

## Mathematical Background
Key equations and explanations...

## How to Use
1. Adjust parameter X
2. Observe effect Y
3. ...

## Additional Resources
- Reference 1
- Reference 2
```

## 🔧 Technical Stack

- React: UI components
- Firebase: Backend services (Firestore, Storage)
- Tailwind CSS: Styling
- React Router: Navigation
- Lucide Icons: UI elements
- KaTeX: Mathematical expressions

## 📝 Documentation Requirements

When submitting a simulation, please include:
- Description of the concept being demonstrated
- Clear user instructions
- Scientific/mathematical background
- Code comments explaining complex logic
- References or additional resources

## 📞 Contact

For questions about SimLab:
- Email: edulens43@gmail.com
- GitHub: Royaltyprogram

## ⚠️ Important Note

While SimLab is a personal project, anyone can freely contribute simulations. The project's core codebase is maintained privately.

---

Created and maintained by Royaltyprogram
