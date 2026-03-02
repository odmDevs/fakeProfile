/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { BaseText } from "@components/BaseText";
import { Button } from "@components/Button";
import { Divider } from "@components/Divider";
import ErrorBoundary from "@components/ErrorBoundary";
import { Flex } from "@components/Flex";
import { HeadingSecondary } from "@components/Heading";
import { Notice } from "@components/Notice";
import { Paragraph } from "@components/Paragraph";
import { classNameFactory } from "@utils/css";
import { copyWithToast, fetchUserProfile, openInviteModal } from "@utils/discord";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { useAwaiter } from "@utils/react";
import definePlugin from "@utils/types";
import { User, UserProfile } from "@vencord/discord-types";
import { findComponentByCodeLazy } from "@webpack";
import { ColorPicker, Forms, Toasts, UserProfileStore, UserStore, useState } from "@webpack/common";
import virtualMerge from "virtual-merge";

import { AvatarDecoration } from "./lib/api";
import { CDN_URL, INVITE_LINK, SKU_ID } from "./lib/constants";
import { useUserDecorAvatarDecoration, useUsersProfileBadges, useUsersProfileStore } from "./lib/storage";
import { Nameplate } from "./lib/types";
import { Colors, decode, encode } from "./lib/utils/profile";
import { settings } from "./settings";

const cl = classNameFactory("vc-FPpfp-");

interface ProfileModalProps {
    user: User;
    pendingThemeColors: [number, number];
    onAvatarChange: () => void;
    onBannerChange: () => void;
    canUsePremiumCustomization: boolean;
    hideExampleButton: boolean;
    hideFakeActivity: boolean;
    isTryItOut: boolean;
}

const ProfileModal = findComponentByCodeLazy<ProfileModalProps>("isTryItOut:", "pendingThemeColors:", "pendingAvatarDecoration:", "EDIT_PROFILE_BANNER");

function SettingsAboutComponentWrapper() {
    const [, , userProfileLoading] = useAwaiter(() => fetchUserProfile(UserStore.getCurrentUser().id));

    return !userProfileLoading && <SettingsAboutComponent />;
}

function SettingsAboutComponent() {
    const existingColors = decode(
        UserProfileStore.getUserProfile(UserStore.getCurrentUser().id)?.bio ?? ""
    ) ?? [0, 0];
    const [color1, setColor1] = useState(existingColors[0]);
    const [color2, setColor2] = useState(existingColors[1]);

    return (
        <section>
            <Notice.Info className={Margins.bottom8}>
                Using all features are local only, they're visible for you and plugin users only.
            </Notice.Info>
            <Paragraph className={Margins.top8}>
                <Flex className={cl("settings")}>
                    <Button
                        variant="link"
                        className={cl("settings-button")}
                        onClick={() => openInviteModal(INVITE_LINK)}
                    >
                        Join fakeProfile Server
                    </Button>
                </Flex>
                <Divider
                    className={classes(Margins.top8, Margins.bottom8)}
                />
                <Forms.FormTitle tag="h3">Color pickers</Forms.FormTitle>
                <Flex gap="1em">
                    <ColorPicker
                        color={color1}
                        label={
                            <BaseText
                                size="xs"
                                style={{ marginTop: "4px" }}
                            >
                                Primary
                            </BaseText>
                        }
                        onChange={(color: number) => {
                            setColor1(color);
                        }}
                    />
                    <ColorPicker
                        color={color2}
                        label={
                            <BaseText
                                size="xs"
                                style={{ marginTop: "4px" }}
                            >
                                Accent
                            </BaseText>
                        }
                        onChange={(color: number) => {
                            setColor2(color);
                        }}
                    />
                    <Button
                        onClick={() => {
                            const colorString = encode(color1, color2);
                            copyWithToast(colorString);
                        }}
                        className={cl("settings-button")}
                    >
                        Copy 3y3
                    </Button>
                </Flex>
                <Divider
                    className={classes(Margins.top8, Margins.bottom8)}
                />
                <HeadingSecondary>Preview</HeadingSecondary>
                <div className="vc-fpt-preview">
                    <ProfileModal
                        user={UserStore.getCurrentUser()}
                        pendingThemeColors={[color1, color2]}
                        onAvatarChange={() => { }}
                        onBannerChange={() => { }}
                        canUsePremiumCustomization={true}
                        hideExampleButton={true}
                        hideFakeActivity={true}
                        isTryItOut={true}
                    />
                </div>
            </Paragraph>
        </section>
    );
}

export default definePlugin({
    name: "fakeProfile Revamp",
    description: "Unlock Discord profile effects, themes, avatar decorations, and custom badges without the need for Nitro.",
    authors: [{
        name: "Extbhite",
        id: 849335684161601546n,
    }],
    dependencies: ["MessageDecorationsAPI", "BadgeAPI"],
    settings,
    settingsAboutComponent: SettingsAboutComponentWrapper,
    async start() {
        if (settings.store.enableCustomBadges) {
            useUsersProfileBadges.getState().fetchBadges();
        }
        if (settings.store.enableAvatarDecorations) {
            useUsersProfileStore.getState().fetchDecorations();
        }
        useUsersProfileStore.getState().fetch(UserStore.getCurrentUser().id, true);
    },
    flux: {
        USER_PROFILE_MODAL_OPEN: data => {
            useUsersProfileStore.getState().fetch(data.userId, true);
        },
    },
    patches: [
        {
            find: ':"SHOULD_LOAD");',
            replacement: {
                match: /\i(?:\?)?.getPreviewBanner\(\i,\i,\i\)(?=.{0,100}"COMPLETE")/,
                replace: "$self.patchBannerUrl(arguments[0])||$&"

            }
        },
        {
            find: "\"data-selenium-video-tile\":",
            predicate: () => settings.store.voiceBackground,
            replacement: [
                {
                    match: /(?<=function\((\i),\i\)\{)(?=let.{20,40},style:)/,
                    replace: "Object.assign($1.style=$1.style||{},$self.getVoiceBackgroundStyles($1));"
                }
            ]
        },
        {
            find: "UserProfileStore",
            replacement: {
                match: /(?<=getUserProfile\(\i\){return )(.+?)(?=})/,
                replace: "$self.colorDecodeHook($1)"
            },
        },
        {
            find: "#{intl::USER_SETTINGS_RESET_PROFILE_THEME}",
            replacement: {
                match: /#{intl::USER_SETTINGS_RESET_PROFILE_THEME}\).+?}\)(?=\])(?<=color:(\i),.{0,500}?color:(\i),.{0,500}?)/,
                replace: "$&,$self.addCopy3y3Button({primary:$1,accent:$2})"
            }
        },
        {
            find: "getUserAvatarURL:",
            replacement: [
                {
                    match: /(getUserAvatarURL:)(\i),/,
                    replace: "$1$self.getAvatarHook($2),"
                },
            ]
        },
        {
            find: "#{intl::GUILD_OWNER}),",
            predicate: () => settings.store.enableCustomNameplates,
            replacement: [
                {
                    match: /user:(\i).{0,150}nameplate:(\i).*?name:null.*?(?=avatar:)/,
                    replace: "$&fpNameplate:$self.customnameplate($1, $2),",
                },
                {
                    match: /(?<=\),nameplate:)(\i)/,
                    replace: "$self.nameplate($1)"
                }
            ]
        },
        {
            find: "role:\"listitem\",innerRef",
            predicate: () => settings.store.enableCustomNameplates,
            replacement: {
                match: /children:\[(?=.{0,100}\.MEMBER_LIST)/,
                replace: "$&arguments[0].fpNameplate,"
            }
        },
        {
            find: "getAvatarDecorationURL:",
            replacement: {
                match: /(?<=function \i\((\i)\){)(?=let{avatarDecoration)/,
                replace: "const vcDecorDecoration=$self.getDecorAvatarDecorationURL($1);if(vcDecorDecoration)return vcDecorDecoration;",
                predicate: () => settings.store.enableAvatarDecorations
            }
        },
        {
            find: "isAvatarDecorationAnimating:",
            group: true,
            replacement: [
                // Add Decor avatar decoration hook to avatar decoration hook
                {
                    match: /(?<=\.avatarDecoration,guildId:\i\}\)\),)(?<=user:(\i).+?)/,
                    replace: "vcDecorAvatarDecoration=$self.useUserDecorAvatarDecoration($1),",
                    predicate: () => settings.store.enableAvatarDecorations
                },
                // Use added hook
                {
                    match: /(?<={avatarDecoration:).{1,20}?(?=,)(?<=avatarDecorationOverride:(\i).+?)/,
                    replace: "$1??vcDecorAvatarDecoration??($&)",
                    predicate: () => settings.store.enableAvatarDecorations
                },
                // Make memo depend on added hook
                {
                    match: /(?<=size:\i}\),\[)/,
                    replace: "vcDecorAvatarDecoration,",
                    predicate: () => settings.store.enableAvatarDecorations
                }
            ]
        },
        ...[
            '"Message Username"', // Messages
            "#{intl::COLLECTIBLES_NAMEPLATE_PREVIEW_A11Y}", // Nameplate preview
            "#{intl::COLLECTIBLES_PROFILE_PREVIEW_A11Y}", // Avatar preview
        ].map(find => ({
            find,
            replacement: {
                match: /(?<=userValue:)((\i(?:\.author)?)\?\.avatarDecoration)/,
                replace: "$self.useUserDecorAvatarDecoration($2)??$1",
                predicate: () => settings.store.enableAvatarDecorations
            }
        })),
    ],
    useUserDecorAvatarDecoration,

    // Profile color themes
    colorDecodeHook(user: UserProfile) {
        if (user?.bio) {
            // don't replace colors if already set with nitro
            if (settings.store.nitroFirst && user.themeColors) return user;
            const colors = decode(user.bio);
            if (colors) {
                return virtualMerge(user, {
                    premiumType: 2,
                    themeColors: colors
                });
            }
        }
        return user;
    },
    addCopy3y3Button: ErrorBoundary.wrap(function ({ primary, accent }: Colors) {
        return <Button
            onClick={() => {
                const colorString = encode(primary, accent);
                copyWithToast(colorString);
            }}
            className={cl("settings-button")}
        >Copy 3y3
        </Button >;
    }, { noop: true }),

    // Decor
    getDecorAvatarDecorationURL({ avatarDecoration, canAnimate }: { avatarDecoration: AvatarDecoration | null; canAnimate?: boolean; }) {
        if (!avatarDecoration || !settings.store.enableAvatarDecorations) return;

        if (settings.store.enableAvatarDecorations) {
            if (canAnimate && avatarDecoration?.animated) {
                if (avatarDecoration?.skuId === SKU_ID) {
                    const url = new URL(`${CDN_URL}/decors/${avatarDecoration?.asset}.png`);
                    return url.toString();
                } else {
                    const url = new URL(`https://cdn.discordapp.com/avatar-decoration-presets/${avatarDecoration?.asset}.png`);
                    return url.toString();
                }
            } else {
                if (avatarDecoration?.skuId === SKU_ID) {
                    const url = new URL(`${CDN_URL}/decors/${avatarDecoration?.asset}.png`);
                    return url.toString();
                } else {
                    const url = new URL(`https://cdn.discordapp.com/avatar-decoration-presets/${avatarDecoration?.asset}.png?passthrough=false`);
                    return url.toString();
                }
            }
        } else {
            return;
        }
    },

    // Banner
    getVoiceBackgroundStyles({ className, participantUserId }: any) {
        if (className.includes("tile")) {
            if (this.userHasBackground(participantUserId)) {
                return {
                    backgroundImage: `url(${this.getImageUrl(participantUserId)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                };
            }
        }
    },

    patchBannerUrl({ displayProfile }: any) {
        if (displayProfile?.banner && settings.store.nitroFirst) return;
        const userData = useUsersProfileStore.getState().get(displayProfile?.userId);
        if (userData && userData.banner) return userData.banner;
    },

    // Avatar
    getAvatarHook: (original: any) => (user: User, animated: boolean, size: number) => {
        if (settings.store.nitroFirst && user.avatar?.startsWith("a_")) return original(user, animated, size);

        const userData = useUsersProfileStore.getState().get(user.id);
        if (animated) {
            return userData?.avatar ?? original(user, animated, size);
        } else {
            const avatarUrl = userData?.avatar;
            if (avatarUrl && typeof avatarUrl === "string") {
                const parsedUrl = new URL(avatarUrl);
                const image_name = parsedUrl.pathname.split("/").pop()?.replace(/\.(gif|webp)$/i, ".png");
                if (image_name) {
                    return CDN_URL + "/avatar/" + image_name;
                }
            }
            return original(user, animated, size);
        }
    },

    // Nameplate
    nameplate(nameplate: Nameplate | undefined) {
        return nameplate;
    },

    customnameplate(user: User, nameplate: Nameplate | undefined) {
        const userId = user?.id;

        const userData = useUsersProfileStore.getState().get(userId);
        if (userData && userData?.nameplate && settings.store.enableCustomNameplates) {
            const url = userData.nameplate;
            const urlStr = url.src;
            return (<img id={`custom-nameplate-${user.id}`} src={urlStr} className="custom-nameplate" />);
        }
        return null;
    },

    toolboxActions: {
        async "Refetch fakeProfile"() {
            useUsersProfileBadges.getState().fetchBadges();
            useUsersProfileStore.getState().fetchDecorations();
            useUsersProfileStore.getState().fetch(UserStore.getCurrentUser().id, true);

            Toasts.show({
                message: "Successfully refetched fakeProfile!",
                id: Toasts.genId(),
                type: Toasts.Type.SUCCESS
            });
        }
    },
});
