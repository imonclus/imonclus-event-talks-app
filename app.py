import os
import re
import xml.etree.ElementTree as ET
import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_html_tags(html_content):
    """Removes HTML tags and cleans up whitespace to create plain text."""
    if not html_content:
        return ""
    # Replace common spacing tags with actual spaces
    text = html_content.replace("<br>", " ").replace("<br/>", " ").replace("</p>", " \n").replace("</li>", " \n")
    # Strip remaining HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Unescape HTML entities if any (like &amp;, &lt;, &gt;, &quot;)
    import html
    text = html.unescape(text)
    # Clean up excess whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    # Clean up excess newlines
    text = re.sub(r'\n\s*\n+', '\n\n', text)
    return text.strip()

def parse_release_notes(xml_data):
    """Parses Atom XML feed and splits entry contents into individual updates."""
    try:
        # Atom feed namespace
        namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
        root = ET.fromstring(xml_data)
        
        releases = []
        
        # Iterate over all <entry> elements
        for entry in root.findall('atom:entry', namespaces):
            title = entry.find('atom:title', namespaces)
            date_str = title.text if title is not None else "Unknown Date"
            
            entry_id_el = entry.find('atom:id', namespaces)
            entry_id = entry_id_el.text if entry_id_el is not None else ""
            
            updated_el = entry.find('atom:updated', namespaces)
            updated_date = updated_el.text if updated_el is not None else ""
            
            link_el = entry.find('atom:link[@rel="alternate"]', namespaces)
            if link_el is None:
                link_el = entry.find('atom:link', namespaces)
            link = link_el.attrib.get('href', '') if link_el is not None else ''
            
            content_el = entry.find('atom:content', namespaces)
            content_html = content_el.text if content_el is not None else ""
            
            updates = []
            
            if content_html:
                # Split content by <h3> headers to segment individual updates
                if '<h3>' in content_html:
                    parts = re.split(r'<h3>(.*?)</h3>', content_html)
                    # parts[0] is text before first h3 (usually empty or intro)
                    intro = parts[0].strip()
                    if intro and len(clean_html_tags(intro)) > 5:
                        updates.append({
                            "type": "General",
                            "content_html": intro,
                            "content_text": clean_html_tags(intro)
                        })
                        
                    for i in range(1, len(parts), 2):
                        category = parts[i].strip()
                        content = parts[i+1].strip() if i+1 < len(parts) else ""
                        updates.append({
                            "type": category,
                            "content_html": content,
                            "content_text": clean_html_tags(content)
                        })
                else:
                    # Fallback if there are no <h3> tags
                    updates.append({
                        "type": "Update",
                        "content_html": content_html,
                        "content_text": clean_html_tags(content_html)
                    })
            
            releases.append({
                "date": date_str,
                "id": entry_id,
                "updated": updated_date,
                "link": link,
                "updates": updates
            })
            
        return releases
    except Exception as e:
        print(f"Error parsing XML: {e}")
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        # Fetch the release notes feed
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(FEED_URL, headers=headers, timeout=15)
        response.raise_for_status()
        
        # Parse and structure the data
        releases = parse_release_notes(response.content)
        
        return jsonify({
            "status": "success",
            "count": len(releases),
            "data": releases
        })
    except requests.RequestException as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to fetch release notes: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"An unexpected error occurred: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Bind to all interfaces to make it accessible in local network if needed, port 5000
    app.run(debug=True, host='127.0.0.1', port=5000)
