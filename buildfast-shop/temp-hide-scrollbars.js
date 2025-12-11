const fs = require('fs');
const os = require('os');
const path = 'src/index.css';
let text = fs.readFileSync(path, 'utf8');
const normalize = (str) => str.split('\n').join(os.EOL);
const replaceBlock = (oldStr, newStr) => {
  const oldNormalized = normalize(oldStr);
  if (text.includes(oldNormalized)) {
    text = text.replace(oldNormalized, normalize(newStr));
  }
};
const removeBlock = (oldStr) => {
  const oldNormalized = normalize(oldStr);
  if (text.includes(oldNormalized)) {
    text = text.replace(oldNormalized, '');
  }
};
replaceBlock(
  ody,\nhtml {\n  background-color: #0f172a; /* slate-900 fallback */\n  min-height: 100vh;\n}\n,
  ody,\nhtml {\n  background-color: #0f172a; /* slate-900 fallback */\n  min-height: 100vh;\n  -ms-overflow-style: none;\n  scrollbar-width: none;\n}\n\nhtml::-webkit-scrollbar,\nbody::-webkit-scrollbar,\n*::-webkit-scrollbar {\n  display: none;\n}\n\n* {\n  -ms-overflow-style: none;\n  scrollbar-width: none;\n}\n
);
removeBlock(/* Custom scrollbar for dark theme */\n::-webkit-scrollbar {\n  width: 8px;\n  height: 8px;\n}\n\n::-webkit-scrollbar-track {\n  background: rgba(255, 255, 255, 0.02);\n}\n\n::-webkit-scrollbar-thumb {\n  background: rgba(197, 157, 95, 0.3);\n  border-radius: 4px;\n}\n\n::-webkit-scrollbar-thumb:hover {\n  background: rgba(197, 157, 95, 0.5);\n}\n\n/* Custom scrollbar class for cart sidebar */\n.custom-scrollbar::-webkit-scrollbar {\n  width: 6px;\n}\n\n.custom-scrollbar::-webkit-scrollbar-track {\n  background: transparent;\n}\n\n.custom-scrollbar::-webkit-scrollbar-thumb {\n  background: rgba(197, 157, 95, 0.2);\n  border-radius: 3px;\n}\n\n.custom-scrollbar::-webkit-scrollbar-thumb:hover {\n  background: rgba(197, 157, 95, 0.4);\n}\n\n);
removeBlock(/* ============================================\n   CUSTOM SCROLLBAR STYLES\n   ============================================ */\n\n.custom-scrollbar::-webkit-scrollbar {\n  width: 8px;\n}\n\n.custom-scrollbar::-webkit-scrollbar-track {\n  background: rgba(255, 255, 255, 0.05);\n  border-radius: 10px;\n}\n\n.custom-scrollbar::-webkit-scrollbar-thumb {\n  background: var(--accent);\n  border-radius: 10px;\n  opacity: 0.5;\n}\n\n.custom-scrollbar::-webkit-scrollbar-thumb:hover {\n  background: var(--accent);\n  opacity: 0.8;\n}\n\n/* Firefox scrollbar */\n.custom-scrollbar {\n  scrollbar-width: thin;\n  scrollbar-color: var(--accent) rgba(255, 255, 255, 0.05);\n}\n);
fs.writeFileSync(path, text);
