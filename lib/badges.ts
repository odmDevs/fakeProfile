/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addProfileBadge, BadgePosition, removeProfileBadge } from "@api/Badges";
import { debounce } from "@shared/debounce";
import { proxyLazy } from "@utils/lazy";
import { zustandCreate } from "@webpack/common";

import { Badge, getBadges } from "../lib/api";
import { settings } from "../settings";

export const useUsersProfileBadges = proxyLazy(() => zustandCreate((set: any, get: any) => ({
    badges: new Map<string, Badge[]>(),
    addedBadges: [],
    fetchBadges: debounce(async () => {
        if (!settings.store.enableCustomBadges) return;

        const { addedBadges } = get();

        addedBadges.forEach(badge => removeProfileBadge(badge));

        const fetchedBadges = await getBadges();
        const newBadges = new Map(
            Object.entries(fetchedBadges).map(([key, value]) => [key, value])
        );

        const newAddedBadges: any[] = [];

        newBadges.forEach((userBadges, userId) => {
            if (Array.isArray(userBadges)) {
                userBadges.forEach(badge => {
                    const newBadge = {
                        iconSrc: badge.badge,
                        description: badge.tooltip,
                        position: BadgePosition.START,
                        shouldShow: ({ userId: badgeUserId }) => badgeUserId === userId,
                        ...(badge.badge_id && { id: badge.badge_id })
                    };
                    addProfileBadge(newBadge);
                    newAddedBadges.push(newBadge);
                });
            }
        });

        set({
            badges: newBadges,
            addedBadges: newAddedBadges,
        });
    }),
})));
