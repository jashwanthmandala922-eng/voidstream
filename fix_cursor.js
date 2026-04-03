const fs = require('fs');
const path = require('path');

const walk = dir => {
  return fs.readdirSync(dir).reduce((files, file) => {
    const name = path.join(dir, file);
    return fs.statSync(name).isDirectory() ? [...files, ...walk(name)] : [...files, name];
  }, []);
};

walk('C:/Users/jashu/Documents/Voidstream/src')
  .filter(f => f.endsWith('.jsx'))
  .forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if(content.includes("cursor: 'none'")) {
      content = content.replace(/cursor:\s*'none'/g, "cursor: 'pointer'");
      fs.writeFileSync(f, content);
      console.log('Fixed cursor in ' + f);
    }
  });
