import { Plugin, PluginSettingTab, Setting, SliderComponent, Debouncer, debounce } from "obsidian";

interface LineLengthPluginSettings {
    mode: string; // preset, percentage, characters, pixels
    sourcePercentage: number;
    sourceCharacters: number;
    sourcePixels: number;
    previewPercentage: number;
    previewCharacters: number;
    previewPixels: number;
}

const DEFAULT_SETTINGS: LineLengthPluginSettings = {
    mode: "characters",
    sourcePercentage: 50,
    sourceCharacters: 46,
    sourcePixels: 1000,
    previewPercentage: 50,
    previewCharacters: 46,
    previewPixels: 1000,
};

export default class LineLengthPlugin extends Plugin {
    settings: LineLengthPluginSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new LineLengthSettingTab(this));
        this.updateLineLength();

        console.log("LineLengthPlugin loaded");
    }

    async onunload() {
        console.log("LineLengthPlugin  unloaded");
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

        for (const key in this.settings) {
            if (!(key in DEFAULT_SETTINGS)) {
                // @ts-ignore
                delete this.settings[key];
            }
        }

        if (!["characters", "percentage", "pixels", "preset"].includes(this.settings.mode)) {
            this.settings.mode = "preset";
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private setReadableLineLength(value: boolean): void {
        this.app.vault.setConfig("readableLineLength", value);
    }

    public updateLineLength(): void {
        const disabled = this.settings.mode === "preset";
        this.setReadableLineLength(disabled);

        if (disabled) {
            document.body.removeClass("line-length-enabled");
            return;
        }

        let sourceLength: string;
        let previewLength: string;
        switch (this.settings.mode) {
            case "characters":
                sourceLength = `${this.settings.sourceCharacters}ch`;
                previewLength = `${this.settings.previewCharacters}ch`;
                break;
            case "percentage":
                sourceLength = `${this.settings.sourcePercentage}%`;
                previewLength = `${this.settings.previewPercentage}%`;
                break;
            default:
                sourceLength = `${this.settings.sourcePixels}px`;
                previewLength = `${this.settings.previewPixels}px`;
                break;
        }

        document.body.addClass("line-length-enabled");
        document.body.style.setProperty("--line-length-source", sourceLength);
        document.body.style.setProperty("--line-length-preview", previewLength);
    }
}

class LineLengthSettingTab extends PluginSettingTab {
    readonly plugin: LineLengthPlugin;

    private static readonly UPDATE_INTERVAL = 30;

    constructor(plugin: LineLengthPlugin) {
        super(plugin.app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        this.containerEl.empty();

        window.setTimeout(() => this.plugin.updateLineLength(), 0);
        const updateDebounced = debounce(
            this.plugin.updateLineLength.bind(this.plugin),
            LineLengthSettingTab.UPDATE_INTERVAL,
            false,
        );

        new Setting(this.containerEl)
            .setName("Mode")
            .setDesc(
                "Choose how to control the maximum line width. Select present to use Obsidian's default.",
            )
            .addDropdown((dropdown) => {
                dropdown
                    .addOption("preset", "Preset")
                    .addOption("characters", "Characters (ch)")
                    .addOption("percentage", "Percentage (%)")
                    .addOption("pixels", "Pixels (px)")
                    .setValue(this.plugin.settings.mode)
                    .onChange(async (value) => {
                        this.plugin.settings.mode = value;
                        this.display();
                        updateDebounced();
                        await this.plugin.saveSettings();
                    });
            });

        switch (this.plugin.settings.mode) {
            case "characters":
                new Setting(this.containerEl)
                    .setName("Maximum line length in preview mode")
                    .setDesc("Maximum line length as character count (ch).")
                    .addExtraButton((button) => {
                        button.setIcon("reset").onClick(async () => {
                            this.plugin.settings.sourceCharacters =
                                DEFAULT_SETTINGS.sourceCharacters;
                            this.plugin.updateLineLength();
                            this.display();
                            await this.plugin.saveSettings();
                        });
                    })
                    .addSlider((slider) =>
                        slider
                            .setInstant(true)
                            .setLimits(30, 200, 1)
                            .setValue(this.plugin.settings.sourceCharacters)
                            .onChange(async (value) => {
                                this.plugin.settings.sourceCharacters = value;
                                updateDebounced();
                                await this.plugin.saveSettings();
                            }),
                    );

                new Setting(this.containerEl)
                    .setName("Maximum line length in preview mode")
                    .setDesc("Maximum line length as character count (ch).")
                    .addExtraButton((button) => {
                        button.setIcon("reset").onClick(async () => {
                            this.plugin.settings.previewCharacters =
                                DEFAULT_SETTINGS.previewCharacters;
                            this.plugin.updateLineLength();
                            this.display();
                            await this.plugin.saveSettings();
                        });
                    })
                    .addSlider((slider) =>
                        slider
                            .setInstant(true)
                            .setLimits(30, 200, 1)
                            .setValue(this.plugin.settings.previewCharacters)
                            .onChange(async (value) => {
                                this.plugin.settings.previewCharacters = value;
                                updateDebounced();
                                await this.plugin.saveSettings();
                            }),
                    );
                break;
            case "percentage":
                new Setting(this.containerEl)
                    .setName("Maximum line length in preview mode")
                    .setDesc("Maximum line length as percentage of the window width (%).")
                    .addExtraButton((button) => {
                        button.setIcon("reset").onClick(async () => {
                            this.plugin.settings.sourcePercentage =
                                DEFAULT_SETTINGS.sourcePercentage;
                            this.plugin.updateLineLength();
                            this.display();
                            await this.plugin.saveSettings();
                        });
                    })
                    .addSlider((slider) =>
                        slider
                            .setInstant(true)
                            .setLimits(20, 100, 1)
                            .setValue(this.plugin.settings.sourcePercentage)
                            .onChange(async (value) => {
                                this.plugin.settings.sourcePercentage = value;
                                updateDebounced();
                                await this.plugin.saveSettings();
                            }),
                    );

                new Setting(this.containerEl)
                    .setName("Maximum line length in preview mode")
                    .setDesc("Maximum line length as percentage of the window width (%).")
                    .addExtraButton((button) => {
                        button.setIcon("reset").onClick(async () => {
                            this.plugin.settings.previewPercentage =
                                DEFAULT_SETTINGS.previewPercentage;
                            this.plugin.updateLineLength();
                            this.display();
                            await this.plugin.saveSettings();
                        });
                    })
                    .addSlider((slider) =>
                        slider
                            .setInstant(true)
                            .setLimits(20, 100, 1)
                            .setValue(this.plugin.settings.previewPercentage)
                            .onChange(async (value) => {
                                this.plugin.settings.previewPercentage = value;
                                updateDebounced();
                                await this.plugin.saveSettings();
                            }),
                    );
                break;
            case "pixels":
                new Setting(this.containerEl)
                    .setName("Maximum line length in preview mode")
                    .setDesc("Maximum line length as pixels (px).")
                    .addExtraButton((button) => {
                        button.setIcon("reset").onClick(async () => {
                            this.plugin.settings.sourcePixels = DEFAULT_SETTINGS.sourcePixels;
                            this.plugin.updateLineLength();
                            this.display();
                            await this.plugin.saveSettings();
                        });
                    })
                    .addSlider((slider) =>
                        slider
                            .setInstant(true)
                            .setLimits(400, 3000, 50)
                            .setValue(this.plugin.settings.sourcePixels)
                            .onChange(async (value) => {
                                this.plugin.settings.sourcePixels = value;
                                updateDebounced();
                                await this.plugin.saveSettings();
                            }),
                    );

                new Setting(this.containerEl)
                    .setName("Maximum line length in preview mode")
                    .setDesc("Maximum line length as pixels (px).")
                    .addExtraButton((button) => {
                        button.setIcon("reset").onClick(async () => {
                            this.plugin.settings.previewPixels = DEFAULT_SETTINGS.previewPixels;
                            this.plugin.updateLineLength();
                            this.display();
                            await this.plugin.saveSettings();
                        });
                    })
                    .addSlider((slider) =>
                        slider
                            .setInstant(true)
                            .setLimits(400, 3000, 50)
                            .setValue(this.plugin.settings.previewPixels)
                            .onChange(async (value) => {
                                this.plugin.settings.previewPixels = value;
                                updateDebounced();
                                await this.plugin.saveSettings();
                            }),
                    );
                break;
        }
    }
}
