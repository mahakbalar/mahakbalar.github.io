export const GOOGLE_SHEET_ID = '14GiANYV7aPrbtJTPOsov25ZI_1bi1UzhUZP74RDlM5I'; // Set your Google Sheet ID here
export const CLIENTS_SHEET_GID = '0'; // Sheet tab ID for 'clients' (0 is usually the first sheet)
export const STORIES_SHEET_GID = '1445885408'; // Sheet tab ID for 'stories' - change this!

function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim().replace(/^"|"$/g, ''));

    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = cells[index] || '';
    });

    if (Object.values(obj).some(val => val !== '')) {
      data.push(obj);
    }
  }

  return data;
}

function parseArrayCell(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value !== 'string') {
    return value ? [String(value)] : [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  return trimmed.split(',').map(item => item.trim()).filter(Boolean);
}

export async function fetchSheetData(sheetId, sheetGid) {
  if (!sheetId) {
    throw new Error('Google Sheet ID is not configured. Set GOOGLE_SHEET_ID in js/data-loader.js');
  }

  console.log(`Fetching sheet GID: ${sheetGid} from ID: ${sheetId}`);

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${sheetGid}`;
  console.log('Request URL:', url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets request failed with status ${response.status}`);
    }

    const text = await response.text();
    console.log('CSV Response:', text);

    const rawRows = parseCSV(text);
    console.log('Parsed rows:', rawRows);

    return rawRows.map(row => {
      const normalized = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = String(key).trim();
        normalized[normalizedKey] = row[key];
      });

      if (normalized.impact !== undefined && normalized.impact !== '') {
        normalized.impact = parseArrayCell(normalized.impact);
      } else {
        normalized.impact = [];
      }

      if (normalized.images !== undefined && normalized.images !== '') {
        normalized.images = parseArrayCell(normalized.images);
      } else {
        normalized.images = [];
      }

      return normalized;
    });
  } catch (error) {
    console.error(`Error fetching sheet GID ${sheetGid}:`, error);
    throw error;
  }
}

