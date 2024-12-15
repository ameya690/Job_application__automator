import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import os
import time

class APIDocScraper:
    def __init__(self, base_url):
        self.base_url = base_url
        self.visited_urls = set()
        self.content = []

    def is_valid_url(self, url):
        parsed = urlparse(url)
        return bool(parsed.netloc) and bool(parsed.scheme)

    def get_linked_urls(self, url, soup):
        links = []
        for a_tag in soup.find_all("a", href=True):
            href = a_tag.get("href")
            full_url = urljoin(url, href)
            if self.is_valid_url(full_url):
                links.append(full_url)
        return links

    def extract_text_content(self, soup):
        for script in soup(["script", "style"]):
            script.decompose()
        return " ".join(soup.stripped_strings)

    def download_image(self, img_url, save_path):
        response = requests.get(img_url)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(response.content)
            return save_path
        return None

    def scrape_page(self, url):
        if url in self.visited_urls:
            return

        self.visited_urls.add(url)
        print(f"Scraping: {url}")

        try:
            response = requests.get(url)
            if response.status_code != 200:
                print(f"Failed to fetch {url}: Status code {response.status_code}")
                return

            soup = BeautifulSoup(response.text, "html.parser")
            
            # Extract text content
            text_content = self.extract_text_content(soup)
            
            # Extract and download images
            images = []
            for img in soup.find_all("img", src=True):
                img_url = urljoin(url, img["src"])
                if self.is_valid_url(img_url):
                    img_filename = os.path.join("images", os.path.basename(urlparse(img_url).path))
                    saved_path = self.download_image(img_url, img_filename)
                    if saved_path:
                        images.append(saved_path)

            # Store the content
            self.content.append({
                "url": url,
                "text": text_content,
                "images": images
            })

            # Find and scrape linked pages
            for linked_url in self.get_linked_urls(url, soup):
                if linked_url.startswith(self.base_url) and linked_url not in self.visited_urls:
                    time.sleep(1)  # Be polite, wait between requests
                    self.scrape_page(linked_url)

        except Exception as e:
            print(f"An error occurred while scraping {url}: {str(e)}")

    def start_scraping(self):
        if not os.path.exists("images"):
            os.makedirs("images")
        self.scrape_page(self.base_url)

    def get_scraped_content(self):
        return self.content

# Usage example
if __name__ == "__main__":
    base_url = "https://docs.mem0.ai/"  # API docs URL
    scraper = APIDocScraper(base_url)
    scraper.start_scraping()
    scraped_content = scraper.get_scraped_content()
    
    # Here you can process or store the scraped content as needed
    print(f"Scraped {len(scraped_content)} pages")
    for page in scraped_content:
        print(f"URL: {page['url']}")
        print(f"Text length: {len(page['text'])} characters")
        print(f"Images: {len(page['images'])}")
        print("---")
    