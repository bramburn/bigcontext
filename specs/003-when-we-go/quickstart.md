# Quickstart Guide: Enhanced File Scanning Progress Messages

This guide provides steps to quickly verify the functionality of the enhanced file scanning progress messages feature.

## Prerequisites
- VS Code installed.
- The BigContext VS Code extension installed and enabled.
- A repository with some files (and optionally a `.gitignore` file with some ignored patterns) opened in VS Code.

## Verification Steps

1.  **Launch VS Code and Open a Repository**:
    - Open VS Code and open a local repository (e.g., the `bigcontext` repository itself).

2.  **Navigate to the Extension's First Page (Configuration)**:
    - Ensure the BigContext extension is active. If it's the first time running in this workspace, it should present a configuration page.
    - Complete any necessary initial configuration steps on this page.

3.  **Navigate to the Subsequent Page**:
    - After configuration, proceed to the next page of the extension's UI.

4.  **Observe Initial Scan Message**:
    - **Expected Result**: Immediately upon navigating to the subsequent page, a status message indicating "Scanning full file structure..." should be displayed prominently in the extension's UI.

5.  **Observe Progress Messages**:
    - As the file scanning progresses, observe the UI for updated progress messages.
    - **Expected Result**: Periodically, messages like "Scanned X files, Y ignored..." should appear, where X and Y are increasing numbers reflecting the files processed and ignored.

6.  **Observe Completion Message**:
    - Once the file scanning is complete, the progress messages should update to a final summary.
    - **Expected Result**: A message similar to "Scan complete: Z files in repo, W files not considered." should be displayed, where Z is the total number of files in the repository and W is the total number of files not considered (e.g., by `.gitignore`).

## Troubleshooting
- If no messages appear, ensure the extension is active and the repository has files.
- Check VS Code's Developer Tools console for any errors related to the extension or webview communication.
