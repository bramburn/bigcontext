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
