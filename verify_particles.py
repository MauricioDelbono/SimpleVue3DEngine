from playwright.sync_api import sync_playwright
import time

def verify_particles():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        try:
            page.goto("http://localhost:5173")

            # Wait for canvas to be present
            page.wait_for_selector("canvas")

            # Wait a bit for particles to spawn
            time.sleep(2)

            # Take screenshot
            page.screenshot(path="verification_particles.png")
            print("Screenshot taken.")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_particles()
