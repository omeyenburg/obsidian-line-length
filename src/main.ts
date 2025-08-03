import {
	Plugin,
	PluginSettingTab,
	Setting,
	SliderComponent,
	Debouncer,
	debounce,
} from "obsidian";

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
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);

		for (const key in this.settings) {
			if (!(key in DEFAULT_SETTINGS)) {
				// @ts-ignore
				delete this.settings[key];
			}
		}

		if (
			!["characters", "percentage", "pixels", "preset"].includes(
				this.settings.mode,
			)
		) {
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

		let sourceLength, previewLength: string;
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

	private settingsEnabled = true;
	private mode: string | null = null;

	private static readonly UPDATE_INTERVAL = 30;

	constructor(plugin: LineLengthPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		this.containerEl.empty();
		window.setTimeout(() => this.plugin.updateLineLength(), 0);

		this.settingsEnabled = true;
		this.createSetting(
			"Mode",
			"Choose how to control the maximum line width.\nSelect present to use Obsidian's default.",
		).addDropdown((dropdown) => {
			dropdown
				.addOption("preset", "Preset")
				.addOption("characters", "Characters (ch)")
				.addOption("percentage", "Percentage (%)")
				.addOption("pixels", "Pixels (px)")
				.setValue(this.plugin.settings.mode)
				.onChange(async (value) => {
					this.plugin.settings.mode = value;
					this.plugin.updateLineLength();
					this.display();
					await this.plugin.saveSettings();
				});
		});

		if (this.mode === null && this.plugin.settings.mode === "preset") {
			this.mode = DEFAULT_SETTINGS.mode;
		} else if (this.plugin.settings.mode !== "preset") {
			this.mode = this.plugin.settings.mode;
		}

		const updateDebounced = debounce(
			this.plugin.updateLineLength.bind(this.plugin),
			LineLengthSettingTab.UPDATE_INTERVAL,
			false,
		);

		this.settingsEnabled = this.plugin.settings.mode !== "preset";
		switch (this.mode) {
			case "characters":
				this.createSetting(
					"Maximum line length in edit mode",
					"Maximum line length as character count (ch).",
					() => {
						this.plugin.settings.sourceCharacters =
							DEFAULT_SETTINGS.sourceCharacters;
						updateDebounced();
					},
				).addSlider((slider) =>
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

				this.createSetting(
					"Maximum line length in preview mode",
					"Maximum line length as character count (ch).",
					() => {
						this.plugin.settings.previewCharacters =
							DEFAULT_SETTINGS.previewCharacters;
						this.plugin.updateLineLength();
					},
				).addSlider((slider) =>
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
				this.createSetting(
					"Maximum line length in edit mode",
					"Maximum line length as percentage of the window width (%).",
					() => {
						this.plugin.settings.sourcePercentage =
							DEFAULT_SETTINGS.sourcePercentage;
						this.plugin.updateLineLength();
					},
				).addSlider((slider) =>
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

				this.createSetting(
					"Maximum line length in preview mode",
					"Maximum line length as percentage of the window width (%).",
					() => {
						this.plugin.settings.previewPercentage =
							DEFAULT_SETTINGS.previewPercentage;
						this.plugin.updateLineLength();
					},
				).addSlider((slider) =>
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
			default:
				this.createSetting(
					"Maximum line length in edit mode",
					"Maximum line length as pixels (px).",
					() => {
						this.plugin.settings.sourcePixels =
							DEFAULT_SETTINGS.sourcePixels;
						this.plugin.updateLineLength();
					},
				).addSlider((slider) =>
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

				this.createSetting(
					"Maximum line length in preview mode",
					"Maximum line length as pixels (px).",
					() => {
						this.plugin.settings.previewPixels =
							DEFAULT_SETTINGS.previewPixels;
						this.plugin.updateLineLength();
					},
				).addSlider((slider) =>
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

	createSetting(name: string, desc?: string, onReset?: () => void): Setting {
		const setting = new Setting(this.containerEl).setName(name);

		if (desc) {
			if (desc.includes("\n")) {
				const lines = desc.split("\n");

				setting.setDesc(
					createFragment((frag) =>
						lines.forEach((line, index) => {
							frag.createEl("span", { text: line });
							if (index < lines.length - 1) {
								frag.createEl("br");
							}
						}),
					),
				);
			} else {
				setting.setDesc(desc);
			}
		}

		if (onReset) {
			setting.addExtraButton((button) => {
				button.setIcon("reset").onClick(async () => {
					onReset();
					this.display();
					await this.plugin.saveSettings();
				});

				if (this.settingsEnabled) button.setTooltip("Restore default");
			});
		}

		if (!this.settingsEnabled) {
			setting.infoEl.style.opacity = "0.4";
			setting.controlEl.style.opacity = "0.4";
			setting.controlEl.style.filter = "grayscale(100%)";

			window.setTimeout(() => {
				setting.components.forEach((comp) => {
					comp.setDisabled(true);
				});
			}, 1);
		} else {
			// Show tooltip on all enabled sliders
			// (removing later is not possible)
			window.setTimeout(() => {
				setting.components.forEach((comp) => {
					if (comp instanceof SliderComponent) {
						comp.setDynamicTooltip();
					}
				});
			}, 1);
		}

		return setting;
	}
}
