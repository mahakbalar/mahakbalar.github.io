# portfolio

## Dynamic Google Sheets data

This website now supports loading `clients` and `stories` data from a public Google Sheet.

1. Open `js/data-loader.js`.
2. Set `GOOGLE_SHEET_ID` to your spreadsheet ID.
3. Use two sheets named `clients` and `stories`.

### Expected sheet columns

- `clients` sheet: `name`, `handle`, `role`, `description`, `impact`, `images`
- `stories` sheet: `text`, `client`

`impact` and `images` may be entered as comma-separated values or JSON arrays.

The page loads data only from the configured Google Sheet and no longer uses local JSON files.
