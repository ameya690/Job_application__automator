import replicate
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document

load_dotenv()

REPLICATE_API_TOKEN = os.environ.get("REPLICATE_API_TOKEN")

class JobDescriptionAnalyzer:
    def __init__(self, api_token):
        os.environ['REPLICATE_API_TOKEN'] = api_token
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )

    def scrape_text_content(self, url):
        try:
            response = requests.get(url)
            response.raise_for_status()
            html_content = response.text

            soup = BeautifulSoup(html_content, 'html.parser')

            # Remove script, style, and other unwanted elements
            for element in soup(['script', 'style', 'header', 'footer', 'nav', 'aside', 'noscript']):
                element.decompose()

            # Extract text
            text = soup.get_text(separator='\n')

            # Clean up the text
            lines = [line.strip() for line in text.splitlines()]
            text_content = '\n'.join(line for line in lines if line)

            return text_content

        except Exception as e:
            print(f"An error occurred: {e}")
            return ""

    def analyze_job_description(self, job_description):
        # Split the text into chunks
        docs = [Document(page_content=job_description, metadata={})]
        chunks = self.text_splitter.split_documents(docs)

        combined_analysis = ""
        for chunk in chunks:
            prompt = f"""Analyze the following part of a job description and provide suggestions for a resume:

        Job Description Part:
        {chunk.page_content}

        Please provide:
        1. Key skills required
        2. Tools and technologies mentioned
        3. Preferred qualifications
        4. Suggestions for resume improvements
        """

        output = replicate.run(
            "meta/meta-llama-3-70b-instruct",
            input={
                "prompt": prompt,
                "max_length": 1000,
                "temperature": 0.7,
                "top_p": 0.9,
            },
        )

        # Convert output to string if necessary
        if isinstance(output, list):
            output = ''.join(output)
        elif not isinstance(output, str):
            output = str(output)

        combined_analysis += output + "\n\n"

        return combined_analysis

def main():
    analyzer = JobDescriptionAnalyzer(REPLICATE_API_TOKEN)

    #url = input("Please enter the URL of the job description: ")
    url = "https://www.amazon.jobs/en/jobs/2740350/data-engineer-summer-internship-2025-us"
    job_description = analyzer.scrape_text_content(url)


    if job_description:
        print("\nAnalyzing job description...")
        result = analyzer.analyze_job_description(job_description)
        print("\nAnalysis Result:")
        print(result)
    else:
        print("No text content extracted.")

if __name__ == "__main__":
    main()
