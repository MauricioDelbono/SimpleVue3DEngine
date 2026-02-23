from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:5173")
            page.goto("http://localhost:5173")

            # Wait for the hierarchy header to appear
            print("Waiting for .scene-hierarchy .header")
            page.wait_for_selector(".scene-hierarchy .header")

            # Take a screenshot of the entire page first for context
            page.screenshot(path="verification/full_page.png")

            # Take a screenshot of the scene hierarchy specifically
            header = page.locator(".scene-hierarchy .header")
            if header.count() > 0:
                print("Found header, taking screenshot")
                header.screenshot(path="verification/hierarchy_header.png")
            else:
                print("Header not found")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
