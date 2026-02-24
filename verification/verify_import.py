from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173")
            print("Waiting for .scene-hierarchy...")
            page.wait_for_selector(".scene-hierarchy", timeout=10000)

            print("Checking Import Model button...")
            button = page.locator("button:has-text('Import Model')")
            if button.is_visible():
                print("Import Model button is visible")
            else:
                print("Import Model button is NOT visible")

            print("Checking file input...")
            file_input = page.locator("input[type='file']")
            if file_input.count() > 0:
                 print("File input exists")

            print("Taking screenshot...")
            page.screenshot(path="verification/verification.png")
            print("Screenshot saved to verification/verification.png")

        except Exception as e:
            print(f"Error: {e}")
            try:
                page.screenshot(path="verification/verification_error.png")
                print("Error screenshot saved.")
            except:
                pass
        finally:
            browser.close()

if __name__ == "__main__":
    run()
