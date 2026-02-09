import cron from 'node-cron';
import Project from '../models/Project.js';
import Cache from '../models/Cache.js';
import { fetchGitHubPRs, fetchGitHubCommits, getGitHubIntegration } from './githubService.js';
import { fetchSlackMessages, getSlackIntegration } from './slackService.js';

async function refreshProjectData(project) {
    const orgId = project.organization;
    console.log(`Refreshing project: ${project.name} (${project._id})`);

    // Refresh GitHub data
    if (project.githubRepo) {
        console.log(`  - Fetching GitHub data for ${project.githubRepo}`);
        const githubIntegration = await getGitHubIntegration(orgId);
        if (githubIntegration) {
            try {
                const [prs, commits] = await Promise.all([
                    fetchGitHubPRs(githubIntegration.accessToken, project.githubRepo),
                    fetchGitHubCommits(githubIntegration.accessToken, project.githubRepo)
                ]);

                console.log(`  - Found ${prs.length} PRs, ${commits.length} commits`);

                await Cache.findOneAndUpdate(
                    { project: project._id, type: 'github_prs' },
                    { data: prs, lastUpdated: new Date() },
                    { upsert: true }
                );

                await Cache.findOneAndUpdate(
                    { project: project._id, type: 'github_commits' },
                    { data: commits, lastUpdated: new Date() },
                    { upsert: true }
                );
            } catch (err) {
                console.error(`  - GitHub fetch error:`, err.message);
            }
        } else {
            console.log(`  - No GitHub integration found for org ${orgId}`);
        }
    }

    // Refresh Slack data
    if (project.slackChannel) {
        console.log(`  - Fetching Slack data for channel ${project.slackChannel}`);
        const slackIntegration = await getSlackIntegration(orgId);
        if (slackIntegration) {
            try {
                const messages = await fetchSlackMessages(slackIntegration.accessToken, project.slackChannel);
                console.log(`  - Found ${messages.length} Slack messages`);

                await Cache.findOneAndUpdate(
                    { project: project._id, type: 'slack_messages' },
                    { data: messages, lastUpdated: new Date() },
                    { upsert: true }
                );
            } catch (err) {
                console.error(`  - Slack fetch error:`, err.message);
            }
        } else {
            console.log(`  - No Slack integration found for org ${orgId}`);
        }
    }
}

async function refreshAllProjects() {
    console.log('Starting data refresh...');
    try {
        const projects = await Project.find({
            $or: [
                { githubRepo: { $exists: true, $ne: '' } },
                { slackChannel: { $exists: true, $ne: '' } }
            ]
        });

        for (const project of projects) {
            await refreshProjectData(project);
        }

        console.log(`Refreshed data for ${projects.length} projects`);
    } catch (error) {
        console.error('Refresh error:', error);
    }
}

export function startScheduler() {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', refreshAllProjects);
    console.log('Scheduler started - refreshing data every 5 minutes');

    // Initial refresh after 10 seconds
    setTimeout(refreshAllProjects, 10000);
}

export { refreshProjectData };
