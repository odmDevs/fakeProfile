/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    nitroFirst: {
        description: "Things to use if both Nitro and fakeProfile things are present",
        type: OptionType.SELECT,
        options: [
            { label: "Nitro", value: true, default: true },
            { label: "fakeProfile", value: false },
        ]
    },
    enableCustomNameplates: {
        description: "Allows you to use custom fakeProfile nameplates",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true
    },
    enableCustomBadges: {
        description: "Allows you to use custom fakeProfile badges",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true
    },
    enableAvatarDecorations: {
        description: "Allows you to use fakeProfile's avatar decorations",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true
    },
    voiceBackground: {
        description: "Use fakeProfile banners as voice chat backgrounds",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true
    }
});
