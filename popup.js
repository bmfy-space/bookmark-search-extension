let selectedIndex = -1;
let bookmarks = [];

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const bookmarksList = document.getElementById('bookmarksList');

  searchInput.focus();

  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.toLowerCase();
    await searchBookmarks(query);
  });

  document.addEventListener('keydown', (e) => {
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveSelection(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveSelection(-1);
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < bookmarks.length) {
          openBookmark(bookmarks[selectedIndex].url);
        }
        break;
    }
  });
});

async function searchBookmarks(query) {
  const bookmarksList = document.getElementById('bookmarksList');
  bookmarksList.innerHTML = '';
  selectedIndex = -1;

  if (!query) {
    bookmarks = [];
    return;
  }

  const allBookmarks = await chrome.bookmarks.search({});
  
  bookmarks = allBookmarks.filter(bookmark => {
    if (!bookmark.url) return false;
    
    try {
      const url = new URL(bookmark.url);
      const domain = url.hostname.toLowerCase();
      const title = bookmark.title.toLowerCase();
      const searchQuery = query.toLowerCase();
      
      const pinyinInitials = pinyinPro.pinyin(bookmark.title, {
        pattern: 'first',
        toneType: 'none',
        type: 'array'
      }).join('').toLowerCase();
      
      return title.includes(searchQuery) || 
             domain.includes(searchQuery) ||
             bookmark.url.toLowerCase().includes(searchQuery) ||
             pinyinInitials.includes(searchQuery);
    } catch (e) {
      return false;
    }
  }).slice(0, 100);

  bookmarks.forEach((bookmark, index) => {
    const item = createBookmarkElement(bookmark, index);
    bookmarksList.appendChild(item);
  });

  if (bookmarks.length > 0) {
    selectedIndex = 0;
    const firstItem = bookmarksList.querySelector('.bookmark-item');
    if (firstItem) {
      firstItem.classList.add('selected');
    }
  }
}

function createBookmarkElement(bookmark, index) {
  const item = document.createElement('div');
  item.className = 'bookmark-item';
  item.dataset.index = index;

  const favicon = document.createElement('img');
  favicon.className = 'favicon';
  favicon.src = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(bookmark.url)}`;
  favicon.onerror = () => {
    favicon.src = getDefaultIcon();
  };

  const info = document.createElement('div');
  info.className = 'bookmark-info';

  const title = document.createElement('div');
  title.className = 'bookmark-title';
  title.textContent = bookmark.title;

  const url = document.createElement('div');
  url.className = 'bookmark-url';
  try {
    const urlObj = new URL(bookmark.url);
    url.textContent = urlObj.hostname;
  } catch (e) {
    url.textContent = bookmark.url;
  }

  info.appendChild(title);
  info.appendChild(url);
  item.appendChild(favicon);
  item.appendChild(info);

  item.addEventListener('click', () => {
    openBookmark(bookmark.url);
  });

  return item;
}

function moveSelection(direction) {
  const items = document.querySelectorAll('.bookmark-item');
  if (items.length === 0) return;

  items[selectedIndex]?.classList.remove('selected');
  selectedIndex = (selectedIndex + direction + items.length) % items.length;
  items[selectedIndex].classList.add('selected');
  items[selectedIndex].scrollIntoView({ block: 'nearest' });
}

function openBookmark(url) {
  chrome.tabs.create({ url });
  window.close();
}

function getDefaultIcon() {
  return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iI2NjYyIgdmlld0JveD0iMCAwIDE2IDE2Ij48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHJ4PSIyIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+';
} 