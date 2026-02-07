import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Script to help generate release notes from git commits and package version.
 * Usage: npx ts-node scripts/generate-release.ts
 */

async function generate() {
    console.log('🚀 Generating release draft...');

    // 1. Get version from package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = `v${packageJson.version}`;

    // 2. Get commits since last tag or last N commits
    let commits: string[] = [];
    try {
        const gitCommits = execSync('git log -n 20 --pretty=format:"%s"').toString().split('\n');
        commits = gitCommits.filter(c => !c.startsWith('chore') && !c.startsWith('feat: release'));
    } catch (e) {
        console.warn('Failed to fetch git logs');
    }

    // 3. Categorize commits
    const features = commits.filter(c => c.startsWith('feat')).map(c => c.replace('feat: ', '').trim());
    const fixes = commits.filter(c => c.startsWith('fix')).map(c => c.replace('fix: ', '').trim());
    const improvements = commits.filter(c => c.startsWith('perf') || c.startsWith('refactor')).map(c => c.replace(/perf:|refactor:/, '').trim());

    // 4. Create Draft Object
    const draft = {
        version,
        title: `Release ${version}`,
        description: "Draft release generated from git history.",
        features: features.length > 0 ? features : ["Add new feature here"],
        fixes: fixes.length > 0 ? fixes : ["Fix known issue here"],
        improvements: improvements.length > 0 ? improvements : ["Performance optimization"],
        breaking_changes: [],
        is_major: false
    };

    // 5. Output for copy-paste or future automated insertion
    const outputPath = path.join(process.cwd(), 'release-draft.json');
    fs.writeFileSync(outputPath, JSON.stringify(draft, null, 2));

    console.log(`✅ Draft generated at ${outputPath}`);
    console.log(`\nVersion: ${version}`);
    console.log(`Features: ${features.length}`);
    console.log(`Fixes: ${fixes.length}`);
}

generate().catch(console.error);
