/**
 * Service to manage site blocking using declarativeNetRequest
 */
import { storage } from '../utils/storage.js';

export const blockerService = {
    DEFAULT_BLOCKED_SITES: [
        "youtube.com",
        "linkedin.com",
        "x.com",
        "facebook.com",
        "instagram.com"
    ],

    getBlockedSites: async () => {
        const settings = await storage.get('settings') || { blockedSites: blockerService.DEFAULT_BLOCKED_SITES };
        return settings.blockedSites;
    },

    updateBlockingRules: async (shouldBlock) => {
        const blockedSites = await blockerService.getBlockedSites();
        const rules = [];

        if (shouldBlock) {
            blockedSites.forEach((site, index) => {
                rules.push({
                    id: index + 1,
                    priority: 1,
                    action: {
                        type: 'redirect',
                        redirect: { extensionPath: '/pages/focus.html' }
                    },
                    condition: {
                        urlFilter: `*://${site}/*`,
                        resourceTypes: ['main_frame']
                    }
                });
            });
        }

        const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
        const removeRuleIds = currentRules.map(rule => rule.id);

        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: removeRuleIds,
            addRules: rules
        });
    }
};
