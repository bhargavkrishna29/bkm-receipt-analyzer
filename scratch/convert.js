const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, '../.gemini/screens');
const outDir = path.join(__dirname, '../app/generated');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(screensDir, file), 'utf-8');
  
  // Extract body content
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) return;
  
  let jsx = bodyMatch[1];
  
  // Basic JSX conversions
  jsx = jsx.replace(/class="/g, 'className="');
  jsx = jsx.replace(/for="/g, 'htmlFor="');
  
  // Close unclosed tags
  jsx = jsx.replace(/<img([^>]*?[^\/])>/g, '<img$1 />');
  jsx = jsx.replace(/<input([^>]*?[^\/])>/g, '<input$1 />');
  jsx = jsx.replace(/<br([^>]*?[^\/])>/g, '<br$1 />');
  jsx = jsx.replace(/<hr([^>]*?[^\/])>/g, '<hr$1 />');
  
  // HTML Comments to JSX Comments
  jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

  // Convert style strings to objects
  jsx = jsx.replace(/style="([^"]*)"/g, (match, p1) => {
    const parts = p1.split(';').filter(Boolean);
    const styleObj = {};
    parts.forEach(part => {
      const [key, val] = part.split(':');
      if (key && val) {
        const camelKey = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
        styleObj[camelKey] = val.trim();
      }
    });
    return `style={${JSON.stringify(styleObj)}}`;
  });

  const componentName = file.replace('.html', '').charAt(0).toUpperCase() + file.replace('.html', '').slice(1);
  const outPath = path.join(outDir, `${componentName}.tsx`);
  
  const finalCode = `
export default function ${componentName}Page() {
  return (
    <>
      ${jsx}
    </>
  );
}
`;

  fs.writeFileSync(outPath, finalCode);
  console.log(`Converted ${file} to ${outPath}`);
});
