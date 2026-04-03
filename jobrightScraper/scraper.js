console.log('[JobRight Scraper] v3.0.0 - Scraper loaded on jobright.ai');

const isInIframe = (window !== window.top);
const urlParams = new URLSearchParams(window.location.search);
const isScrapeRequest = urlParams.get('jobright_scraper') === 'true';

if (isInIframe) {
  console.log('[JobRight Scraper] Running inside iframe - injecting Scrape buttons');
  initIframeMode();
} else if (isScrapeRequest) {
  console.log('[JobRight Scraper] Standalone scrape request detected');
  initScrapeMode();
} else {
  console.log('[JobRight Scraper] Regular jobright.ai page, doing nothing');
}

function initIframeMode() {
  function injectScrapeButtons() {
    const allLinks = document.querySelectorAll('a[href*="jobright.ai/jobs"]');
    const applyLinks = Array.from(allLinks).filter(link => {
      const text = link.textContent.trim().toLowerCase();
      return text.includes('apply');
    });
    console.log('[JobRight Scraper] Found ' + allLinks.length + ' total job links, ' + applyLinks.length + ' Apply links');
    
    applyLinks.forEach((applyBtn) => {
      const parentCell = applyBtn.closest('td') || applyBtn.parentElement;
      if (!parentCell || parentCell.querySelector('.jobright-scrape-btn')) {
        return;
      }

      const scrapeBtn = document.createElement('button');
      scrapeBtn.className = 'jobright-scrape-btn';
      scrapeBtn.textContent = 'Scrape';
      scrapeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showRolePicker(applyBtn.href, scrapeBtn);
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
}

function showRolePicker(jobUrl, anchorEl) {
  var existing = document.querySelector('.jobright-role-picker');
  if (existing) existing.remove();

  var picker = document.createElement('div');
  picker.className = 'jobright-role-picker';
  picker.style.cssText = 'position:absolute;z-index:999999;background:#1f2937;border:1px solid #374151;border-radius:8px;padding:6px;display:flex;gap:4px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';

  var roles = [
    { label: 'ML', value: 'ml', color: '#8b5cf6' },
    { label: 'SDE', value: 'sde', color: '#3b82f6' },
    { label: 'Startup', value: 'startup', color: '#f59e0b' }
  ];

  roles.forEach(function(role) {
    var btn = document.createElement('button');
    btn.textContent = role.label;
    btn.style.cssText = 'padding:4px 10px;border:none;border-radius:4px;color:white;font-size:12px;font-weight:bold;cursor:pointer;background:' + role.color + ';';
    btn.addEventListener('mouseenter', function() { btn.style.opacity = '0.85'; });
    btn.addEventListener('mouseleave', function() { btn.style.opacity = '1'; });
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      picker.remove();

      var separator = jobUrl.includes('?') ? '&' : '?';
      var scrapeUrl = jobUrl + separator + 'jobright_scraper=true&role=' + role.value;

      console.log('[JobRight Scraper] Role selected:', role.label, 'Opening:', scrapeUrl);
      window.open(scrapeUrl, '_blank');
    });
    picker.appendChild(btn);
  });

  var rect = anchorEl.getBoundingClientRect();
  picker.style.position = 'fixed';
  picker.style.top = (rect.bottom + 4) + 'px';
  picker.style.left = rect.left + 'px';
  document.body.appendChild(picker);

  setTimeout(function() {
    document.addEventListener('click', function dismiss() {
      picker.remove();
      document.removeEventListener('click', dismiss);
    }, { once: true });
  }, 100);
}

function initScrapeMode() {
  console.log('[JobRight Scraper] Waiting for page to fully render...');
  var attempts = 0;
  var maxAttempts = 10;
  var selectedRole = urlParams.get('role') || 'ml';
  console.log('[JobRight Scraper] Selected role:', selectedRole);
  
  function tryExtract() {
    attempts++;
    console.log('[JobRight Scraper] Extraction attempt ' + attempts + '/' + maxAttempts);
    
    try {
      var data = extractJobData();
      var hasContent = data.responsibilities.length > 0 || data.qualifications.length > 0;
      
      if (!hasContent && attempts < maxAttempts) {
        console.log('[JobRight Scraper] No content found yet, retrying in 1.5s...');
        setTimeout(tryExtract, 1500);
        return;
      }
      
      var markdown = formatAsMarkdown(data);
      
      fetchResume(selectedRole).then(function(resumeText) {
        if (resumeText) {
          markdown += '\n\nHere is my baseline resume in LaTeX:\n\n' + resumeText;
        }
        return copyToClipboard(markdown);
      }).then(function() {
        console.log('[JobRight Scraper] Data copied to clipboard!');
        showBanner('\u2713 Job details (' + selectedRole.toUpperCase() + ' resume) copied to clipboard!');
      });
    } catch (error) {
      console.error('[JobRight Scraper] Extraction error:', error);
      if (attempts < maxAttempts) {
        setTimeout(tryExtract, 1500);
      } else {
        showBanner('Failed to extract job details: ' + error.message, true);
      }
    }
  }
  
  setTimeout(tryExtract, 3000);
}

function fetchResume(role) {
  var fileMap = {
    'ml': 'resumes/mlr.tex',
    'sde': 'resumes/sde.tex',
    'startup': 'resumes/startup.tex'
  };
  var file = fileMap[role];
  if (!file) {
    console.log('[JobRight Scraper] Unknown role:', role);
    return Promise.resolve('');
  }
  var url = chrome.runtime.getURL(file);
  console.log('[JobRight Scraper] Fetching resume:', url);
  return fetch(url).then(function(resp) {
    return resp.text();
  }).catch(function(err) {
    console.error('[JobRight Scraper] Failed to fetch resume:', err);
    return '';
  });
}

function debugPageStructure() {
  console.log('[JobRight Scraper] === PAGE STRUCTURE DEBUG ===' );
  console.log('[JobRight Scraper] URL:', window.location.href);
  console.log('[JobRight Scraper] Title:', document.title);
  
  var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  console.log('[JobRight Scraper] Headings found:', headings.length);
  headings.forEach(function(h) {
    console.log('[JobRight Scraper]   ' + h.tagName + ': "' + h.textContent.trim().substring(0, 100) + '"');
  });
  
  var lists = document.querySelectorAll('ul, ol');
  console.log('[JobRight Scraper] Lists found:', lists.length);
  lists.forEach(function(list, i) {
    var items = list.querySelectorAll('li');
    var parentTag = list.parentElement ? list.parentElement.tagName : 'none';
    var parentClass = list.parentElement ? list.parentElement.className : '';
    console.log('[JobRight Scraper]   List ' + i + ': ' + items.length + ' items, parent: ' + parentTag + '.' + parentClass.substring(0, 60));
    if (items.length > 0) {
      console.log('[JobRight Scraper]     First item: "' + items[0].textContent.trim().substring(0, 100) + '"');
    }
  });

  var textNodes = document.querySelectorAll('*');
  var sectionKeywords = ['responsibilit', 'qualificat', 'requirement', 'what you', 'about the role', 'job description', 'description', 'preferred', 'minimum', 'basic'];
  console.log('[JobRight Scraper] Elements containing section keywords:');
  textNodes.forEach(function(el) {
    var text = el.textContent.trim().toLowerCase();
    if (text.length > 5 && text.length < 200) {
      sectionKeywords.forEach(function(kw) {
        if (text.includes(kw) && el.children.length < 3) {
          console.log('[JobRight Scraper]   ' + el.tagName + '.' + (el.className || '').substring(0, 40) + ': "' + el.textContent.trim().substring(0, 100) + '"');
        }
      });
    }
  });
  
  console.log('[JobRight Scraper] === END DEBUG ===');
}

function findCompanyName() {
  var selectors = [
    'a[href*="/company/"]',
    'a[href*="/employer/"]',
    '[class*="companyName"]',
    '[class*="company-name"]',
    '[class*="company_name"]',
    '[class*="CompanyName"]',
    '[data-testid*="company"]',
    '[class*="employer"]'
  ];
  
  for (var i = 0; i < selectors.length; i++) {
    var el = document.querySelector(selectors[i]);
    if (el) {
      var text = el.textContent.trim();
      if (text && text.length > 1 && text.length < 100) {
        console.log('[JobRight Scraper] Company found via selector:', selectors[i], '->', text);
        return text;
      }
    }
  }

  var h1 = document.querySelector('h1');
  if (h1) {
    var parent = h1.parentElement;
    if (parent) {
      var links = parent.querySelectorAll('a');
      for (var j = 0; j < links.length; j++) {
        var linkText = links[j].textContent.trim();
        if (linkText && linkText.length > 1 && linkText.length < 100 && linkText !== h1.textContent.trim()) {
          console.log('[JobRight Scraper] Company found near h1 link:', linkText);
          return linkText;
        }
      }
      var spans = parent.querySelectorAll('span, p, div');
      for (var k = 0; k < spans.length; k++) {
        var spanText = spans[k].textContent.trim();
        if (spanText && spanText.length > 1 && spanText.length < 80 && spanText !== h1.textContent.trim() && spans[k].children.length === 0) {
          console.log('[JobRight Scraper] Company found near h1 text:', spanText);
          return spanText;
        }
      }
    }

    var sibling = h1.nextElementSibling;
    var lookAhead = 5;
    while (sibling && lookAhead > 0) {
      var sibLinks = sibling.querySelectorAll('a');
      for (var m = 0; m < sibLinks.length; m++) {
        var sText = sibLinks[m].textContent.trim();
        if (sText && sText.length > 1 && sText.length < 100) {
          console.log('[JobRight Scraper] Company found as sibling of h1:', sText);
          return sText;
        }
      }
      if (sibling.children.length === 0) {
        var directText = sibling.textContent.trim();
        if (directText && directText.length > 1 && directText.length < 80) {
          console.log('[JobRight Scraper] Company found as sibling text of h1:', directText);
          return directText;
        }
      }
      sibling = sibling.nextElementSibling;
      lookAhead--;
    }
  }

  console.log('[JobRight Scraper] Company not found by any method');
  return 'N/A';
}

function extractJobData() {
  console.log('[JobRight Scraper] Extracting job data...');
  debugPageStructure();
  
  var jobTitle = document.querySelector('h1')?.textContent.trim() || 'N/A';
  console.log('[JobRight Scraper] Job title:', jobTitle);

  var company = findCompanyName();
  console.log('[JobRight Scraper] Company:', company);

  var responsibilities = [];
  var qualifications = [];
  var skills = new Set();

  var allElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, span, strong, b');
  var respSection = null;
  var qualSection = null;
  
  allElements.forEach(function(el) {
    var text = el.textContent.trim().toLowerCase();
    var directText = getDirectText(el).toLowerCase();
    if (directText.length < 5) return;
    
    if (matchesSectionName(directText, ['responsibilities', 'what you will do', "what you'll do", 'key responsibilities', 'role responsibilities', 'about the role'])) {
      respSection = el;
      console.log('[JobRight Scraper] Matched RESP section:', el.tagName, '"' + directText + '"');
    }
    if (matchesSectionName(directText, ['qualifications', 'requirements', 'what you need', "what we're looking for", 'basic qualifications', 'minimum qualifications', 'preferred qualifications', 'who you are'])) {
      qualSection = el;
      console.log('[JobRight Scraper] Matched QUAL section:', el.tagName, '"' + directText + '"');
    }
  });

  if (respSection) {
    console.log('[JobRight Scraper] Found responsibilities section, collecting items...');
    collectListItems(respSection, responsibilities);
    console.log('[JobRight Scraper] Responsibilities collected:', responsibilities.length);
  }

  if (qualSection) {
    console.log('[JobRight Scraper] Found qualifications section, collecting items...');
    collectListItems(qualSection, qualifications);
    console.log('[JobRight Scraper] Qualifications collected:', qualifications.length);
    qualifications.forEach(function(q) { extractSkills(q, skills); });
  }

  if (responsibilities.length === 0 && qualifications.length === 0) {
    console.log('[JobRight Scraper] Sections not found. Trying text-based parsing...');
    textBasedParse(responsibilities, qualifications, skills);
  }

  if (responsibilities.length === 0 && qualifications.length === 0) {
    console.log('[JobRight Scraper] Text-based parse found nothing. Trying all UL/OL fallback...');
    var allLists = document.querySelectorAll('ul li, ol li');
    allLists.forEach(function(li) {
      var text = li.textContent.trim();
      if (text && text.length > 20 && text.length < 500) {
        responsibilities.push(text);
        extractSkills(text, skills);
      }
    });
  }

  var skillTags = document.querySelectorAll('[class*="skill"], [class*="tag"], [class*="badge"], [class*="chip"]');
  skillTags.forEach(function(tag) {
    var skillText = tag.textContent.trim();
    if (skillText && skillText.length > 1 && skillText.length < 50) {
      skills.add(skillText);
    }
  });

  console.log('[JobRight Scraper] Final extracted:', {
    responsibilities: responsibilities.length,
    qualifications: qualifications.length,
    skills: skills.size
  });

  var rawText = '';
  if (responsibilities.length === 0 && qualifications.length === 0) {
    var bodyText = document.body.innerText || '';
    var lines = bodyText.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
    rawText = lines.join('\n');
    console.log('[JobRight Scraper] Using raw body text as fallback, length:', rawText.length);
  }

  return {
    jobTitle: jobTitle,
    company: company,
    jobUrl: window.location.href.replace('&jobright_scraper=true', '').replace('?jobright_scraper=true', ''),
    responsibilities: responsibilities,
    qualifications: qualifications,
    skills: Array.from(skills),
    rawText: rawText
  };
}

function getDirectText(el) {
  var text = '';
  el.childNodes.forEach(function(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    }
  });
  return text.trim() || el.textContent.trim();
}

function matchesSectionName(text, keywords) {
  for (var i = 0; i < keywords.length; i++) {
    if (text.includes(keywords[i])) return true;
  }
  return false;
}

function textBasedParse(responsibilities, qualifications, skills) {
  var bodyText = document.body.innerText;
  var lines = bodyText.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
  
  var currentSection = null;
  
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var lower = line.toLowerCase();
    
    if (matchesSectionName(lower, ['responsibilities', 'what you will do', "what you'll do"])) {
      currentSection = 'resp';
      console.log('[JobRight Scraper] Text parse: found resp section at line ' + i + ': "' + line + '"');
      continue;
    }
    if (matchesSectionName(lower, ['qualifications', 'requirements', 'what you need', "what we're looking for", 'who you are'])) {
      currentSection = 'qual';
      console.log('[JobRight Scraper] Text parse: found qual section at line ' + i + ': "' + line + '"');
      continue;
    }
    if (matchesSectionName(lower, ['about us', 'about the company', 'benefits', 'perks', 'compensation', 'salary', 'equal opportunity', 'eeo'])) {
      currentSection = null;
      continue;
    }
    
    if (currentSection && line.length > 10 && line.length < 500) {
      var cleanLine = line.replace(/^[\-\•\*\–\—]\s*/, '').replace(/^\d+\.\s*/, '');
      if (cleanLine.length > 10) {
        if (currentSection === 'resp') {
          responsibilities.push(cleanLine);
        } else if (currentSection === 'qual') {
          qualifications.push(cleanLine);
          extractSkills(cleanLine, skills);
        }
      }
    }
  }
  console.log('[JobRight Scraper] Text parse results - resp:', responsibilities.length, 'qual:', qualifications.length);
}

function collectListItems(headerElement, targetArray) {
  let sibling = headerElement.nextElementSibling;
  let maxLookAhead = 10;
  
  while (sibling && maxLookAhead > 0) {
    if (sibling.tagName === 'UL' || sibling.tagName === 'OL') {
      sibling.querySelectorAll('li').forEach(item => {
        const text = item.textContent.trim();
        if (text) targetArray.push(text);
      });
      return;
    }
    
    const nestedList = sibling.querySelector('ul, ol');
    if (nestedList) {
      nestedList.querySelectorAll('li').forEach(item => {
        const text = item.textContent.trim();
        if (text) targetArray.push(text);
      });
      return;
    }
    
    if (['H1', 'H2', 'H3', 'H4'].includes(sibling.tagName)) {
      return;
    }
    
    sibling = sibling.nextElementSibling;
    maxLookAhead--;
  }
  
  const parent = headerElement.parentElement;
  if (parent) {
    const list = parent.querySelector('ul, ol');
    if (list) {
      list.querySelectorAll('li').forEach(item => {
        const text = item.textContent.trim();
        if (text) targetArray.push(text);
      });
    }
  }
}

function extractSkills(text, skillsSet) {
  const commonSkills = [
    'Python', 'Java', 'JavaScript', 'TypeScript', 'C\\+\\+', 'C#', 'Go', 'Rust', 'Ruby', 'Scala', 'Kotlin', 'Swift',
    'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Cassandra', 'DynamoDB', 'Snowflake',
    'React', 'Angular', 'Vue', 'Node\\.js', 'Express', 'Django', 'Flask', 'Spring', 'Next\\.js',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Jenkins',
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'NLP', 'Computer Vision',
    'Data Analysis', 'Data Science', 'ETL', 'Spark', 'Hadoop', 'Kafka', 'Airflow', 'dbt',
    'Git', 'Agile', 'Scrum', 'REST API', 'GraphQL', 'Microservices', 'Linux'
  ];

  const displayNames = { 'C\\+\\+': 'C++', 'Node\\.js': 'Node.js', 'Next\\.js': 'Next.js' };

  commonSkills.forEach(skill => {
    const regex = new RegExp('\\b' + skill + '\\b', 'i');
    if (regex.test(text)) {
      skillsSet.add(displayNames[skill] || skill);
    }
  });
}

function formatAsMarkdown(data) {
  let md = 'I will provide you with a job description and my baseline resume in LaTeX. Your task is to:\n';
  md += 'Parse the job description to identify core skills, qualifications, and keywords.\n';
  md += 'Rewrite my resume in LaTeX, keeping the structure intact but tailoring content to the JD.\n';
  md += 'Rewrite the experiences, projects, and skills that match the JD (mentioning the preferred tools, skills and languages mentioned).\n';
  md += 'Make sure the experience section is a perfect fit to the JD requirements\n';
  md += 'Reframe bullet points with measurable outcomes and strong action verbs.\n';
  md += 'Insert ATS-friendly keywords naturally (avoid keyword stuffing).\n';
  md += 'Replace terms like "Bayesian" with broader phrasing ("probabilistic/statistical modeling") where appropriate.\n';
  md += 'Ensure the final resume is:\n';
  md += 'ATS-approved (no tables, graphics, icons, or non-standard formatting).\n';
  md += 'Keyword-rich but natural (mirrors the JD).\n';
  md += 'Impact-focused (quantifiable achievements).\n';
  md += 'Role-aligned (Research Scientist, ML Engineer, NLP Scientist, etc.).\n';
  md += 'Inputs I\'ll give you each time:\n';
  md += 'The job description (JD).\n';
  md += 'My baseline resume in LaTeX.\n';
  md += 'Output you give me:\n';
  md += 'A fully tailored LaTeX resume optimized for that job description.\n';
  md += 'Optional: a brief explanation of key changes (why certain skills/phrases were emphasized).\n';
  md += '\nHere is the JD:\n';
  md += '# ' + data.jobTitle + ' at ' + data.company + '\n\n';

  if (data.responsibilities.length > 0) {
    md += '## Responsibilities\n';
    data.responsibilities.forEach(r => { md += '- ' + r + '\n'; });
    md += '\n';
  }

  if (data.qualifications.length > 0) {
    md += '## Qualifications\n';
    data.qualifications.forEach(q => { md += '- ' + q + '\n'; });
    md += '\n';
  }

  if (data.skills.length > 0) {
    md += '## Required Skills\n';
    md += data.skills.join(', ') + '\n';
  }

  if (data.responsibilities.length === 0 && data.qualifications.length === 0 && data.rawText) {
    md += '## Job Description\n';
    md += data.rawText + '\n';
  }

  return md;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

function showBanner(message, isError) {
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:16px;background:' + (isError ? '#ef4444' : '#10b981') + ';color:white;text-align:center;font-size:16px;font-weight:bold;z-index:999999;box-shadow:0 4px 6px rgba(0,0,0,0.1);';
  banner.textContent = message;
  document.body.prepend(banner);
}
