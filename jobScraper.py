import replicate
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
import google.oauth2.credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

load_dotenv()

REPLICATE_API_TOKEN = os.environ.get("REPLICATE_API_TOKEN")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
GOOGLE_REFRESH_TOKEN = os.environ.get("GOOGLE_REFRESH_TOKEN")

class ResumeOptimizer:
    def __init__(self, api_token, google_credentials):
        os.environ['REPLICATE_API_TOKEN'] = api_token
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        self.google_credentials = google_credentials
        self.drive_service = build('drive', 'v3', credentials=self.google_credentials)
        self.docs_service = build('docs', 'v1', credentials=self.google_credentials)

    def scrape_text_content(self, url):
        # Code to scrape text content remains the same as before
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
        # Code to analyze job description remains the same as before
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
    def update_resume(self, resume_id, job_description_analysis):
        try:
            # Retrieve the resume document
            resume_doc = self.docs_service.documents().get(documentId=resume_id).execute()
            resume_text = resume_doc.get('body').get('content')

            # Update the resume based on the job description analysis
            updated_resume_text = self.modify_resume(resume_text, job_description_analysis)

            # Update the resume document
            requests = [
                {
                    "replaceAllText": {
                        "containsText": {
                            "text": resume_text
                        },
                        "replaceText": updated_resume_text
                    }
                }
            ]
            self.docs_service.documents().batchUpdate(
                documentId=resume_id, body={'requests': requests}).execute()

            print("Resume updated successfully!")
        except HttpError as error:
            print(f"An error occurred: {error}")

    def modify_resume(self, resume_text, job_description_analysis):
        # Split the job description analysis into individual sections
        analysis_sections = job_description_analysis.split('\n\n')

        # Extract relevant information from the analysis
        key_skills = self.extract_key_skills(analysis_sections)
        tools_and_tech = self.extract_tools_and_tech(analysis_sections)
        preferred_qualifications = self.extract_preferred_qualifications(analysis_sections)
        resume_improvements = self.extract_resume_improvements(analysis_sections)

        # Modify the resume based on the extracted information
        updated_resume_text = self.update_skills_section(resume_text, key_skills)
        updated_resume_text = self.update_tools_and_tech_section(updated_resume_text, tools_and_tech)
        updated_resume_text = self.update_qualifications_section(updated_resume_text, preferred_qualifications)
        updated_resume_text = self.add_resume_improvements(updated_resume_text, resume_improvements)

        return updated_resume_text

    def extract_key_skills(self, analysis_sections):
        for section in analysis_sections:
            if "Key skills required" in section:
                return section.split("Key skills required")[1].strip()
        return ""

    def extract_tools_and_tech(self, analysis_sections):
        for section in analysis_sections:
            if "Tools and technologies mentioned" in section:
                return section.split("Tools and technologies mentioned")[1].strip()
        return ""

    def extract_preferred_qualifications(self, analysis_sections):
        for section in analysis_sections:
            if "Preferred qualifications" in section:
                return section.split("Preferred qualifications")[1].strip()
        return ""

    def extract_resume_improvements(self, analysis_sections):
        for section in analysis_sections:
            if "Suggestions for resume improvements" in section:
                return section.split("Suggestions for resume improvements")[1].strip()
        return ""

    def update_skills_section(self, resume_text, key_skills):
        # Implement logic to update the skills section of the resume
        # You can use the key_skills information to add or modify the skills
        updated_resume_text = resume_text + "\n\nKey Skills:\n- " + key_skills.replace(", ", "\n- ")
        return updated_resume_text

    def update_tools_and_tech_section(self, resume_text, tools_and_tech):
        # Implement logic to update the tools and technologies section of the resume
        updated_resume_text = resume_text + "\n\nTools and Technologies:\n- " + tools_and_tech.replace(", ", "\n- ")
        return updated_resume_text

    def update_qualifications_section(self, resume_text, preferred_qualifications):
        # Implement logic to update the qualifications section of the resume
        updated_resume_text = resume_text + "\n\nPreferred Qualifications:\n- " + preferred_qualifications.replace(", ", "\n- ")
        return updated_resume_text

    def add_resume_improvements(self, resume_text, resume_improvements):
        # Implement logic to add the resume improvement suggestions to the resume
        updated_resume_text = resume_text + "\n\nResume Improvement Suggestions:\n" + resume_improvements
        return updated_resume_text

def main():
    # Authenticate with Google Drive and Docs APIs
    credentials = google.oauth2.credentials.Credentials(
        token=None,
        refresh_token=GOOGLE_REFRESH_TOKEN,
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        scopes=['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive'])

    optimizer = ResumeOptimizer(REPLICATE_API_TOKEN, credentials)

    # Replace with the actual URL of the job description
    url = "https://www.amazon.jobs/en/jobs/2740350/data-engineer-summer-internship-2025-us"
    job_description = optimizer.scrape_text_content(url)

    if job_description:
        print("\nAnalyzing job description...")
        job_description_analysis = optimizer.analyze_job_description(job_description)
        print("\nAnalysis Result:")
        print(job_description_analysis)

        # Replace with the actual ID of your Google Doc resume
        resume_id = "your_google_doc_resume_id"
        optimizer.update_resume(resume_id, job_description_analysis)
    else:
        print("No text content extracted.")

if __name__ == "__main__":
    main()