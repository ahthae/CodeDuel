import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app.jsx'
import { MathJaxContext } from 'better-react-mathjax'

const config = {
  loader: { load: ["[tex]/html"] },
  tex: {
    packages: { "[+]": ["html"] },
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"]
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"]
    ]
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <MathJaxContext config={config}>
    <App />
  </MathJaxContext>
  </StrictMode>,
)
