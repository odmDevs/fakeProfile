/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { API_BADGE_URL, API_DECOR_URL, BASE_URL } from "./constants";

export interface Badge {
    badge: string;
    tooltip: string;
    badge_id?: string;
}

export interface AvatarDecorations {
    name: string;
    asset: string;
    skuId: string;
    animated: boolean;
}

export interface AvatarDecoration {
    asset: string;
    skuId: string;
    animated: boolean;
}

export const getBadges = async (): Promise<Badge[]> => fetch(API_BADGE_URL).then(c => c.json());
export const getDecors = async (): Promise<AvatarDecorations[]> => fetch(API_DECOR_URL).then(c => c.json());

export const getUsers = async (ids?: string[]): Promise<Record<string, string | null>> => {
    if (ids?.length === 0) return {};

    const url = new URL(BASE_URL + "/api/users");
    if (ids && ids.length !== 0) url.searchParams.set("ids", JSON.stringify(ids));

    return await fetch(url).then(c => c.json());
};
