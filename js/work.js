import { GOOGLE_SHEET_ID, CLIENTS_SHEET_GID, fetchSheetData } from './data-loader.js';

async function loadClients() {
  try {
    if (!GOOGLE_SHEET_ID) {
      throw new Error('Google Sheet ID is not configured. Open js/data-loader.js and set GOOGLE_SHEET_ID.');
    }

    const clients = await fetchSheetData(GOOGLE_SHEET_ID, CLIENTS_SHEET_GID);
    console.log('Loaded clients from Google Sheet:', clients);

    const clientsGrid = document.getElementById('clientsGrid');
    if (!clientsGrid) return;

    if (!clients || clients.length === 0) {
      clientsGrid.innerHTML = '<p>No clients data found.</p>';
      return;
    }

    clients.forEach(client => {
      const clientCard = document.createElement('div');
      clientCard.className = 'client-card reveal';

      const impactList = Array.isArray(client.impact)
        ? client.impact.map(item => `<li>${item}</li>`).join('')
        : '<li>No impact listed</li>';

      const images = Array.isArray(client.images)
        ? client.images.filter(Boolean)
        : (client.image ? [client.image] : []);

      const firstImage = images[0] || '';
      const remainingCount = images.length - 1;
      const badgeHTML = remainingCount > 0 ? `<div class="image-badge">+${remainingCount}</div>` : '';
      const imageUrl = firstImage ? getImageUrl(firstImage) : '';

      const imageHTML = imageUrl ? `
        <div class="image-container">
          <img 
            src="${imageUrl}" 
            alt="${client.name || 'Client'}" 
            class="client-image" 
            data-all-images='${JSON.stringify(images)}'
            data-client-name="${client.name}"
          >
          ${badgeHTML}
        </div>
      ` : '';

      clientCard.innerHTML = `
        <div class="client-header">
          <h3 class="client-name">${client.name || 'Unnamed Client'}</h3>
          <p class="client-handle">${client.handle || 'No handle'}</p>
        </div>
        <span class="client-role">${client.role || 'No role'}</span>
        <p class="client-description">${client.description || 'No description'}</p>
        <div class="client-impact">
          <h4>Impact</h4>
          <ul>
            ${impactList}
          </ul>
        </div>
        <div class="client-media">
          ${imageHTML}
        </div>
      `;

      clientsGrid.appendChild(clientCard);
    });

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('client-image')) {
        const allImages = JSON.parse(e.target.dataset.allImages);
        const clientName = e.target.dataset.clientName;
        openLightbox(allImages, clientName, 0);
      }
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

  document.querySelectorAll('.client-card').forEach(card => {
    observer.observe(card);
  });

  } catch (error) {
    console.error('Error loading clients:', error);
    const clientsGrid = document.getElementById('clientsGrid');
    if (clientsGrid) {
      clientsGrid.innerHTML = `<p style="color: red;">Error loading clients: ${error.message}</p>`;
    }
  }
}

function openLightbox(allImages, clientName, currentIndex = 0) {
  // Remove existing lightbox so we can recreate it cleanly for each client
  const existing = document.getElementById('imageLightbox');
  if (existing) {
    existing.remove();
  }

  const lightbox = document.createElement('div');
  lightbox.id = 'imageLightbox';
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <div class="lightbox-overlay"></div>
    <div class="lightbox-content">
      <button class="lightbox-close" id="lightboxClose">&times;</button>
      ${allImages.length > 1 ? `
        <button class="lightbox-nav lightbox-prev" id="lightboxPrev">&#10094;</button>
        <button class="lightbox-nav lightbox-next" id="lightboxNext">&#10095;</button>
        <div class="image-counter" id="imageCounter"></div>
      ` : ''}
      <div class="lightbox-gallery" id="lightboxGallery"></div>
    </div>
  `;
  document.body.appendChild(lightbox);

  // Store current state
  lightbox.dataset.allImages = JSON.stringify(allImages);
  lightbox.dataset.currentIndex = currentIndex;
  lightbox.dataset.totalImages = allImages.length;

  // Display current image
  displayImage(currentIndex, allImages);
  lightbox.classList.add('active');

  // Close button handler
  const closeBtn = document.getElementById('lightboxClose');
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    closeLightbox();
  };

  // Close on overlay or outer lightbox click
  const overlay = lightbox.querySelector('.lightbox-overlay');
  overlay.onclick = () => {
    closeLightbox();
  };

  lightbox.onclick = (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  };

  // Navigation buttons (if multiple images)
  if (allImages.length > 1) {
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');

    prevBtn.onclick = (e) => {
      e.stopPropagation();
      navigateImage(-1, allImages, lightbox);
    };

    nextBtn.onclick = (e) => {
      e.stopPropagation();
      navigateImage(1, allImages, lightbox);
    };

    // Swipe detection
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, false);

    lightbox.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe(touchStartX, touchEndX, allImages, lightbox);
    }, false);
  }

  // Keyboard navigation
  document.removeEventListener('keydown', handleLightboxKeydown);
  document.addEventListener('keydown', handleLightboxKeydown);
}

// function getImageUrl(imageValue) {
//   if (!imageValue || typeof imageValue !== 'string') return '';

//   const trimmed = imageValue.trim();
//   if (!trimmed) return '';

//   if (/^https?:\/\//i.test(trimmed) || /^\/\//.test(trimmed) || /^data:/i.test(trimmed)) {
//     if (trimmed.includes('drive.google.com')) {
//       const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
//       if (fileIdMatch) {
//         return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
//       }
//       const openIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
//       if (openIdMatch) {
//         return `https://drive.google.com/uc?export=view&id=${openIdMatch[1]}`;
//       }
//     }

//     return trimmed;
//   }

//   return `./img/${trimmed}`;
// }

function getImageUrl(imageValue) {
  if (!imageValue || typeof imageValue !== 'string') return '';

  const trimmed = imageValue.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed) || /^\/\//.test(trimmed) || /^data:/i.test(trimmed)) {
    if (trimmed.includes('drive.google.com')) {
      const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1000`;
      }

      const openIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (openIdMatch) {
        return `https://drive.google.com/thumbnail?id=${openIdMatch[1]}&sz=w1000`;
      }
    }

    return trimmed;
  }

  return `./img/${trimmed}`;
}

function displayImage(index, allImages) {
  const lightbox = document.getElementById('imageLightbox');
  const gallery = document.getElementById('lightboxGallery');
  const imageUrl = getImageUrl(allImages[index]);

  gallery.innerHTML = `<img src="${imageUrl}" alt="Image ${index + 1}" class="gallery-image fullscreen-image">`;

  // Update counter
  const counter = document.getElementById('imageCounter');
  if (counter) {
    counter.textContent = `${index + 1} / ${allImages.length}`;
  }

  lightbox.dataset.currentIndex = index;
}

function navigateImage(direction, allImages, lightbox) {
  let currentIndex = parseInt(lightbox.dataset.currentIndex);
  currentIndex += direction;

  // Wrap around
  if (currentIndex < 0) {
    currentIndex = allImages.length - 1;
  } else if (currentIndex >= allImages.length) {
    currentIndex = 0;
  }

  displayImage(currentIndex, allImages);
}

function handleSwipe(startX, endX, allImages, lightbox) {
  const threshold = 50; // minimum distance to trigger swipe
  const diff = startX - endX;

  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      // Swiped left -> show next image
      navigateImage(1, allImages, lightbox);
    } else {
      // Swiped right -> show previous image
      navigateImage(-1, allImages, lightbox);
    }
  }
}

function handleLightboxKeydown(e) {
  const lightbox = document.getElementById('imageLightbox');
  if (!lightbox || !lightbox.classList.contains('active')) return;

  if (e.key === 'Escape') {
    closeLightbox();
  } else if (e.key === 'ArrowLeft') {
    const allImages = JSON.parse(lightbox.dataset.allImages);
    const prevBtn = document.getElementById('lightboxPrev');
    if (prevBtn) {
      prevBtn.click();
    }
  } else if (e.key === 'ArrowRight') {
    const allImages = JSON.parse(lightbox.dataset.allImages);
    const nextBtn = document.getElementById('lightboxNext');
    if (nextBtn) {
      nextBtn.click();
    }
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('imageLightbox');
  if (lightbox) {
    lightbox.classList.remove('active');
  }
}

document.addEventListener('DOMContentLoaded', loadClients);
