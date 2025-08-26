### Implementation Guide: Sprint 1 - Automated Versioning & Publishing

This guide provides the technical details needed to implement the automated release script.

#### 1. Install Dependencies

First, add `shelljs` to your project to allow the execution of shell commands from a Node.js script. You can do this by running:

```bash
npm install --save-dev shelljs
```

#### 2. Create the Release Script

Create a new folder named `scripts` in the root of your project if it doesn't exist. Inside this folder, create a new file named `release.js`.

**File**: `scripts/release.js`
```javascript
const shell = require('shelljs');

// Exit on error
shell.set('-e');

// --- VALIDATION ---

// 1. Check for clean git working directory
if (shell.exec('git status --porcelain').stdout !== '') {
  shell.echo('❌ Error: Git working directory is not clean. Please commit or stash changes.');
  shell.exit(1);
}

// 2. Check for VSCE_PAT environment variable
if (!process.env.VSCE_PAT) {
  shell.echo('❌ Error: VSCE_PAT environment variable not set.');
  shell.echo('Please set it to your Visual Studio Marketplace Personal Access Token.');
  shell.exit(1);
}

// 3. Get version type from arguments
const versionType = process.argv[2];
if (!['patch', 'minor', 'major'].includes(versionType)) {
  shell.echo(`❌ Error: Invalid version type '${versionType}'. Must be 'patch', 'minor', or 'major'.`);
  shell.echo('Usage: npm run release -- <patch|minor|major>');
  shell.exit(1);
}


// --- EXECUTION ---

shell.echo(`🚀 Starting release process for a '${versionType}' version...`);

try {
  // Run build and tests before releasing
  shell.echo('Step 1: Running build and tests...');
  if (shell.exec('npm run build:all').code !== 0) {
    shell.echo('❌ Error: Build failed.');
    shell.exit(1);
  }
  if (shell.exec('npm test').code !== 0) {
    shell.echo('❌ Error: Tests failed.');
    shell.exit(1);
  }

  // Bump version in package.json and create git tag
  shell.echo(`Step 2: Bumping version and creating git tag...`);
  shell.exec(`npm version ${versionType} -m "chore(release): v%s"`);

  // Publish to marketplace
  shell.echo('Step 3: Publishing to VS Code Marketplace...');
  shell.exec('vsce publish --pat $VSCE_PAT');

  // Push changes to git
  shell.echo('Step 4: Pushing commit and tags to remote...');
  shell.exec('git push --follow-tags');

  shell.echo('✅ Release complete!');

} catch (error) {
  shell.echo(`❌ An error occurred during the release process: ${error.message}`);
  shell.echo('Please check the logs and clean up manually if necessary.');
  shell.exit(1);
}

```

#### 3. Update `package.json`

Add the `release` script to the `"scripts"` section of your root `package.json` file.

```json
{
  "scripts": {
    // ... other scripts
    "release": "node scripts/release.js"
  }
}
```

#### 4. Usage

To run the script, use the following command from your terminal:

```bash
# Ensure you are on the main branch and have pulled the latest changes
git checkout main
git pull

# Set the environment variable (do not add this to a committed file)
export VSCE_PAT="your_personal_access_token"

# Run the release script with the desired version bump
npm run release -- patch
# OR
npm run release -- minor
```

This completes the implementation for the automated publishing script.
