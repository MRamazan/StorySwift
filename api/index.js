const fs = require('fs');
const path = require('path');

function parseStoryFolder(folderName) {
  const parts = folderName.split('_');
  const level = parts[parts.length - 1].toUpperCase();
  const titleParts = parts.slice(0, -1);
  const title = titleParts
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return { title, level };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const urlPath = req.url.replace('/api/', '').split('/').filter(Boolean);
  
  try {
    if (urlPath.length === 0) {
      const storiesPath = path.join(process.cwd(), 'stories');
      const languages = fs.readdirSync(storiesPath);
      const validLanguages = languages.filter(lang => {
        const langPath = path.join(storiesPath, lang);
        return fs.statSync(langPath).isDirectory();
      });
      return res.json(validLanguages);
    }
    
    // GET /api/stories/:language
    if (urlPath.length === 2 && urlPath[0] === 'stories') {
      const language = urlPath[1];
      const languagePath = path.join(process.cwd(), 'stories', language);
      const folders = fs.readdirSync(languagePath);
      
      const stories = folders
        .filter(folder => {
          const folderPath = path.join(languagePath, folder);
          return fs.statSync(folderPath).isDirectory();
        })
        .map(folder => {
          const { title, level } = parseStoryFolder(folder);
          return { id: folder, title, level };
        });
      
      return res.json(stories);
    }
    
    if (urlPath.length === 3 && urlPath[0] === 'story') {
      const language = urlPath[1];
      const storyId = urlPath[2];
      const storyPath = path.join(process.cwd(), 'stories', language, storyId);
      const dataPath = path.join(storyPath, 'data.json');
      
      const data = fs.readFileSync(dataPath, 'utf-8');
      const storyData = JSON.parse(data);
      const { title, level } = parseStoryFolder(storyId);
      
      let storyText = '';
      try {
        storyText = fs.readFileSync(path.join(storyPath, 'story.txt'), 'utf-8');
      } catch {
        try {
          storyText = fs.readFileSync(path.join(storyPath, 'standard.txt'), 'utf-8');
        } catch {
          storyText = '';
        }
      }
      
      return res.json({ title, level, words: storyData, text: storyText });
    }
    
    res.status(404).json({ error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
