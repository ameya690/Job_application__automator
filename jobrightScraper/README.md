# JobRight Scraper Chrome Extension

A Chrome extension that adds "Scrape" buttons to job listings on [newgrad-jobs.com](https://www.newgrad-jobs.com/), allowing you to quickly extract job details (responsibilities, qualifications, and skills) and copy them to your clipboard in Markdown format.

## Features

- 🔘 **One-Click Scraping**: Adds a "Scrape" button next to every "Apply" button on job listing pages
- 📋 **Clipboard Integration**: Automatically copies formatted job details to your clipboard
- 📝 **Markdown Format**: Clean, readable Markdown output perfect for note-taking or documentation
- ✨ **Visual Feedback**: Shows notifications when scraping completes or if errors occur
- 🎯 **Smart Extraction**: Automatically identifies and extracts:
  - Job title and company
  - Location and posting date
  - Responsibilities (bullet points)
  - Qualifications (bullet points)
  - Required skills and technologies

## Installation

### Step 1: Download the Extension

Clone or download this repository to your local machine:

```bash
git clone <repository-url>
cd jobrightScraper
```

Or download as ZIP and extract to a folder.

### Step 2: Load in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **"Load unpacked"**
5. Select the `jobrightScraper` folder
6. The extension should now appear in your extensions list

### Step 3: Verify Installation

- You should see the JobRight Scraper icon in your extensions toolbar
- Navigate to [newgrad-jobs.com](https://www.newgrad-jobs.com/) to test it out

## Usage

### Basic Usage

1. **Navigate to newgrad-jobs.com**
   - Go to any job category page (e.g., `https://www.newgrad-jobs.com/?k=swe` for Software Engineering)

2. **Find a Job You're Interested In**
   - Browse the job listings table

3. **Click the "Scrape" Button**
   - You'll see a green "Scrape" button next to each "Apply" button
   - Click it to scrape that job's details

4. **Wait for Confirmation**
   - The button will show "Scraping..." while fetching data
   - A notification will appear: "✓ Job details copied to clipboard!"

5. **Paste Your Data**
   - Open your favorite note-taking app (Notion, Obsidian, etc.)
   - Press `Ctrl+V` (or `Cmd+V` on Mac) to paste the formatted job details

### Output Format

The scraped data will be formatted as clean Markdown:

```markdown
# Data Engineer at Pierre Fabre Laboratories

**Location:** Secaucus, NJ
**Posted:** 4 hours ago
**URL:** https://jobright.ai/jobs/info/...

## Responsibilities
- Design and implement a scalable, high-performance data architecture aligned with business objectives
- Integrate disparate data sources into a unified, reliable single source of truth
- Cascade global strategy locally while pushing the boundaries of the data and tech stack
- Enable seamless data flow to support digital transformation and integration strategies

## Qualifications
- Bachelor's degree in Computer Science, Data Engineering, or related field
- 5+ years of experience in data engineering
- Strong knowledge of SQL, Python, and ETL processes
- Experience with cloud platforms (AWS, Azure, or GCP)
- Excellent problem-solving and communication skills

## Required Skills
Python, SQL, ETL, AWS, Azure, GCP, Data Engineering, Cloud
```

### Supported Job Categories

The extension works on all newgrad-jobs.com job category pages:

- Software Engineering: `?k=swe`
- Data Analyst: `?k=da`
- AI/ML: `?k=aiml`
- Data Engineer: `?k=de`
- And all other categories!

## Troubleshooting

### "Scrape" Buttons Not Appearing

- **Refresh the page**: Press `F5` or `Ctrl+R`
- **Check extension is enabled**: Go to `chrome://extensions/` and ensure JobRight Scraper is enabled
- **Check the URL**: Make sure you're on `https://www.newgrad-jobs.com/`

### "Failed to scrape job details" Error

- **Network issue**: Check your internet connection
- **Job page changed**: The website structure may have changed; the extension may need updating
- **CORS restrictions**: Some job detail pages may block cross-origin requests
- **Try again**: Click the "Scrape" button again

### Nothing Copied to Clipboard

- **Browser permissions**: Ensure the extension has clipboard permissions
- **Try manual copy**: If automatic clipboard fails, the extension will attempt a fallback method
- **Check browser console**: Press `F12` and look for error messages in the Console tab

### Extension Not Loading

- **Check manifest**: Ensure all files are present in the extension folder
- **Reload extension**: Go to `chrome://extensions/`, find JobRight Scraper, and click the reload icon
- **Check for errors**: Look for error messages on the extension card

## Development

### File Structure

```
jobrightScraper/
├── manifest.json       # Extension configuration
├── content.js          # Main content script (injection + scraping logic)
├── styles.css          # Styling for buttons and notifications
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

### Key Functions

- **`injectScrapeButtons()`**: Finds all Apply buttons and adds Scrape buttons
- **`handleScrape()`**: Manages the scraping workflow and error handling
- **`scrapeJobDetails()`**: Fetches and parses job detail pages
- **`extractSkills()`**: Identifies common technical skills in job descriptions
- **`formatAsMarkdown()`**: Converts job data to Markdown format
- **`copyToClipboard()`**: Copies text to clipboard with fallback support

### Modifying the Extension

To customize the extension:

1. **Edit `content.js`** to change scraping logic or add new features
2. **Edit `styles.css`** to change button appearance or notification styling
3. **Edit `manifest.json`** to add permissions or change configuration
4. **Reload the extension** in `chrome://extensions/` to see changes

## Privacy & Security

- **No data collection**: This extension does not collect, store, or transmit any personal data
- **Local processing**: All scraping happens locally in your browser
- **No external servers**: No data is sent to external servers
- **Clipboard only**: Scraped data is only copied to your clipboard

## Permissions Explained

- **`activeTab`**: Allows the extension to interact with the current tab when you click the Scrape button
- **`scripting`**: Enables injection of the content script into web pages
- **`https://www.newgrad-jobs.com/*`**: Access to newgrad-jobs.com pages
- **`https://jobright.ai/*`**: Access to job detail pages hosted on JobRight

## Known Limitations

- **Single job at a time**: Currently scrapes one job at a time (bulk scraping not yet supported)
- **Website structure dependency**: If newgrad-jobs.com or JobRight.ai changes their HTML structure, the extension may need updates
- **No offline mode**: Requires internet connection to fetch job details
- **Chrome only**: Currently only tested on Google Chrome (may work on other Chromium-based browsers)

## Future Enhancements

Potential features for future versions:

- [ ] Bulk scraping (scrape multiple jobs at once)
- [ ] Export to CSV/JSON files
- [ ] Save scraped jobs in extension storage
- [ ] Job comparison tool
- [ ] Integration with Notion, Airtable, or Google Sheets
- [ ] Custom Markdown templates
- [ ] Filter and search scraped jobs

## Contributing

Found a bug or have a feature request? Feel free to:

1. Open an issue describing the problem or feature
2. Submit a pull request with improvements
3. Share feedback on what works and what doesn't

## License

This project is open source and available for personal use.

## Support

If you encounter issues or have questions:

1. Check the **Troubleshooting** section above
2. Review the browser console for error messages (`F12` → Console tab)
3. Ensure you're using the latest version of Chrome
4. Try reloading the extension in `chrome://extensions/`

---

**Happy job hunting! 🎯**
