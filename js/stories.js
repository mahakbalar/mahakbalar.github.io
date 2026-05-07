import { GOOGLE_SHEET_ID, STORIES_SHEET_GID, fetchSheetData } from './data-loader.js';

async function loadStories() {
  try {
    if (!GOOGLE_SHEET_ID) {
      throw new Error('Google Sheet ID is not configured. Open js/data-loader.js and set GOOGLE_SHEET_ID.');
    }

    const stories = await fetchSheetData(GOOGLE_SHEET_ID, STORIES_SHEET_GID);
    console.log('Loaded stories from Google Sheet:', stories);

    const storiesGrid = document.getElementById('storiesGrid');
    if (!storiesGrid) return;

    if (!stories || stories.length === 0) {
      storiesGrid.innerHTML = '<p>No stories data found.</p>';
      return;
    }

    stories.forEach(story => {
      const storyCard = document.createElement('div');
      storyCard.className = 'story-card reveal';

      storyCard.innerHTML = `
        <p class="story-text">"${story.text || 'No text'}"</p>
        <p class="story-client">— ${story.client || 'Unknown'}</p>
      `;

      storiesGrid.appendChild(storyCard);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.story-card').forEach(card => {
      observer.observe(card);
    });

  } catch (error) {
    console.error('Error loading stories:', error);
    const storiesGrid = document.getElementById('storiesGrid');
    if (storiesGrid) {
      storiesGrid.innerHTML = `<p style="color: red;">Error loading stories: ${error.message}</p>`;
    }
  }
}

document.addEventListener('DOMContentLoaded', loadStories);
