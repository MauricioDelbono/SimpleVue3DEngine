from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:5173/")
        # Wait for the scene hierarchy to be visible
        # Depending on layout, it might be in a sidebar or something.
        page.wait_for_selector(".scene-hierarchy", timeout=10000)

        # Check if the "Scene" text is visible
        scene_header = page.locator(".scene-hierarchy .header")
        if scene_header.is_visible():
            print("Scene header is visible")

        # Check if the import button is visible
        # The button has an icon. It is a VButton which renders a button element.
        # Verify it exists in the header.
        import_button = scene_header.locator("button")
        if import_button.count() > 0:
            print("Import button found")
        else:
            print("Import button NOT found")

        # Take a screenshot of the scene hierarchy
        page.locator(".scene-hierarchy").screenshot(path="verification_scene_hierarchy_component.png")
        page.screenshot(path="verification_full_page.png")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
