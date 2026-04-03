console.log('[JobRight Scraper] v2.0.0 - Content script loaded on newgrad-jobs.com');

function injectScrapeButtons() {
  const applyLinks = document.querySelectorAll('a[href*="jobright.ai"]');
  
  applyLinks.forEach((applyBtn) => {
    const parentCell = applyBtn.closest('td');
    if (!parentCell || parentCell.querySelector('.jobright-scrape-btn')) {
      return;
    }

    const scrapeBtn = document.createElement('button');
    scrapeBtn.className = 'jobright-scrape-btn';
    scrapeBtn.textContent = 'Scrape';
    scrapeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const jobUrl = applyBtn.href;
      const separator = jobUrl.includes('?') ? '&' : '?';
      const scrapeUrl = jobUrl + separator + 'jobright_scraper=true';
      
      console.log('[JobRight Scraper] Opening job page for scraping:', scrapeUrl);
      window.open(scrapeUrl, '_blank');
    });

    parentCell.appendChild(scrapeBtn);
  });
}

const observer = new MutationObserver(() => {
  injectScrapeButtons();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

injectScrapeButtons();
