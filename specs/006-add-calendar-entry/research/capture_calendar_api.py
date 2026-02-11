#!/usr/bin/env python3
"""
Playwright script to capture Sunsama calendar API endpoints.

This script automates the process of:
1. Opening Sunsama in a browser
2. Capturing all network traffic
3. Guiding the user to create a calendar event with calendar selection
4. Exporting all captured API calls for analysis

Usage:
    python capture_calendar_api.py
"""

from playwright.sync_api import sync_playwright
import json
import re
from datetime import datetime
from pathlib import Path


def capture_sunsama_calendar_api():
    """Capture Sunsama API calls related to calendar operations."""

    # Storage for captured network traffic
    captured_requests = []
    captured_responses = []

    print("🎭 Starting Playwright browser automation...")
    print("📝 This script will capture network traffic while you interact with Sunsama\n")

    with sync_playwright() as p:
        # Launch browser in headed mode (visible) so user can interact
        browser = p.chromium.launch(
            headless=False,
            args=['--start-maximized']
        )

        # Create context with viewport
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            # Preserve authentication if available
            storage_state='sunsama_auth.json' if Path('sunsama_auth.json').exists() else None
        )

        page = context.new_page()

        # Network request handler
        def handle_request(request):
            url = request.url
            # Only capture Sunsama API calls
            if 'api.sunsama.com' in url or 'sunsama.com/api' in url:
                captured_requests.append({
                    'timestamp': datetime.now().isoformat(),
                    'method': request.method,
                    'url': url,
                    'headers': dict(request.headers),
                    'post_data': request.post_data if request.method in ['POST', 'PUT', 'PATCH'] else None
                })
                print(f"📤 {request.method} {url}")

        # Network response handler
        def handle_response(response):
            url = response.url
            # Only capture Sunsama API responses
            if 'api.sunsama.com' in url or 'sunsama.com/api' in url:
                try:
                    body = response.text() if response.status == 200 else None
                    captured_responses.append({
                        'timestamp': datetime.now().isoformat(),
                        'method': response.request.method,
                        'url': url,
                        'status': response.status,
                        'headers': dict(response.headers),
                        'body': body
                    })
                    print(f"📥 {response.status} {url}")
                except Exception as e:
                    print(f"⚠️  Could not capture response body: {e}")

        # Register network listeners
        page.on('request', handle_request)
        page.on('response', handle_response)

        print("\n🌐 Navigating to Sunsama...")
        page.goto('https://app.sunsama.com')

        print("\n" + "="*80)
        print("📋 INSTRUCTIONS FOR NETWORK CAPTURE")
        print("="*80)
        print("""
Please perform the following actions in the Sunsama UI:

1. ✅ LOG IN (if not already authenticated)

2. 📅 LIST CALENDARS:
   - Go to Settings > Calendars
   - Observe which calendars are connected
   - (This will help us capture calendar listing API)

3. ➕ CREATE CALENDAR EVENT WITH CALENDAR SELECTION:
   - Click to create a new task/event
   - Set title: "API Test Event"
   - Set time: Today, 10:00-11:00
   - **IMPORTANT**: Click on the calendar dropdown/selector
   - Choose a specific calendar (Google, Outlook, etc.)
   - Save the event

4. 🔄 OPTIONAL - Try these actions:
   - View the created event
   - Edit the calendar selection
   - Delete the test event

5. ✋ When done, return to this terminal and press ENTER
""")
        print("="*80)

        # Wait for user to complete the actions
        input("\n⏸️  Press ENTER when you've finished creating the calendar event...")

        # Save authentication state for future runs
        context.storage_state(path='sunsama_auth.json')
        print("💾 Saved authentication state")

        # Close browser
        browser.close()

    # Export captured data
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_dir = Path(__file__).parent
    output_dir.mkdir(exist_ok=True)

    requests_file = output_dir / f'captured_requests_{timestamp}.json'
    responses_file = output_dir / f'captured_responses_{timestamp}.json'

    with open(requests_file, 'w') as f:
        json.dump(captured_requests, f, indent=2)

    with open(responses_file, 'w') as f:
        json.dump(captured_responses, f, indent=2)

    print(f"\n✅ Captured {len(captured_requests)} requests and {len(captured_responses)} responses")
    print(f"📁 Saved to:")
    print(f"   - {requests_file}")
    print(f"   - {responses_file}")

    # Analyze captured data for calendar-related endpoints
    analyze_calendar_endpoints(captured_requests, captured_responses)

    return captured_requests, captured_responses


def analyze_calendar_endpoints(requests, responses):
    """Analyze captured traffic to identify calendar-related endpoints."""

    print("\n" + "="*80)
    print("🔍 ANALYZING CALENDAR-RELATED ENDPOINTS")
    print("="*80)

    calendar_keywords = ['calendar', 'event', 'timeblock', 'schedule', 'booking']

    calendar_requests = []
    for req in requests:
        url_lower = req['url'].lower()
        if any(keyword in url_lower for keyword in calendar_keywords):
            calendar_requests.append(req)

    if calendar_requests:
        print(f"\n📊 Found {len(calendar_requests)} calendar-related API calls:\n")
        for req in calendar_requests:
            print(f"  {req['method']} {req['url']}")
            if req.get('post_data'):
                print(f"  └─ Body: {req['post_data'][:100]}...")
    else:
        print("\n⚠️  No obvious calendar-related endpoints found.")
        print("   This might mean:")
        print("   - Calendar operations use generic task/event endpoints")
        print("   - Calendar selection is a task property")
        print("   - Need to inspect full request/response bodies manually")

    print("\n💡 Next steps:")
    print("   1. Review the captured JSON files")
    print("   2. Look for POST/PUT requests when creating events")
    print("   3. Check request bodies for 'calendarId' or similar fields")
    print("   4. Examine task creation endpoints for calendar parameters")
    print("="*80)


if __name__ == '__main__':
    try:
        capture_sunsama_calendar_api()
    except KeyboardInterrupt:
        print("\n\n⏹️  Capture interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
