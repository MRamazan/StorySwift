const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

function parseStoryFolder(folderName) {
  const parts = folderName.split('_');
  const level = parts[parts.length - 1].toUpperCase();
  const titleParts = parts.slice(0, -1);
  const title = titleParts
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return { title, level };
}

app.get('/api/languages', async (req, res) => {
  try {
    const storiesPath = path.join(__dirname, 'stories');
    const languages = await fs.readdir(storiesPath);
    const validLanguages = [];
    
    for (const lang of languages) {
      const langPath = path.join(storiesPath, lang);
      const stat = await fs.stat(langPath);
      if (stat.isDirectory()) {
        validLanguages.push(lang);
      }
    }
    
    res.json(validLanguages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stories/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const languagePath = path.join(__dirname, 'stories', language);
    const folders = await fs.readdir(languagePath);
    
    const stories = [];
    for (const folder of folders) {
      const folderPath = path.join(languagePath, folder);
      const stat = await fs.stat(folderPath);
      if (stat.isDirectory()) {
        const { title, level } = parseStoryFolder(folder);
        stories.push({ id: folder, title, level });
      }
    }
    
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/story/:language/:storyId', async (req, res) => {
  try {
    const { language, storyId } = req.params;
    const storyPath = path.join(__dirname, 'stories', language, storyId);
    const dataPath = path.join(storyPath, 'data.json');
    const data = await fs.readFile(dataPath, 'utf-8');
    const storyData = JSON.parse(data);
    const { title, level } = parseStoryFolder(storyId);
    
    let storyText = '';
    try {
      storyText = await fs.readFile(path.join(storyPath, 'story.txt'), 'utf-8');
    } catch {
      try {
        storyText = await fs.readFile(path.join(storyPath, 'standard.txt'), 'utf-8');
      } catch {
        storyText = '';
      }
    }
    
    res.json({ title, level, words: storyData, text: storyText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

});
