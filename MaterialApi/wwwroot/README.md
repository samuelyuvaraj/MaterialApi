# BDL MES - Fixed Common Sidebar Layout

This version fixes the common header/sidebar/footer integration.

Key fixes:
- One common header loaded from components/header.html
- One common sidebar loaded from components/sidebar.html
- One common footer loaded from components/footer.html
- No duplicate sidebar/header on QR Generator
- Sidebar stretches for short and long pages
- Main content scrolls independently
- Existing visual CSS class naming is retained
- Sidebar title no longer receives viewport height
- Active navigation is selected from the current page

Run through the existing localhost web server because the components use fetch().
