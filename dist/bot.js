import fs from "node:fs";
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(decodeURIComponent(fileURLToPath(import.meta.url)));
import * as oceanic from "oceanic.js";
import * as utils from "./utils.js";
import * as builders from "@oceanicjs/builders";
const { token } = JSON.parse(fs.readFileSync(path.join(__dirname, '..') + "/config.json", 'utf8'));
const bot = new oceanic.Client({
    auth: `Bot ${token}`
});
const PetPetUtils = new utils.PetPetUtils();
const collection = new oceanic.Collection();
const commands = [
    {
        data: new builders.ApplicationCommandBuilder(1, "petpet")
            .setDMPermission(true)
            .setDescription("create a headpat gif")
            .addOption({
            type: oceanic.ApplicationCommandOptionTypes.USER,
            required: true,
            name: "user",
            description: "user to make headpat gif of"
        })
            .addOption({
            type: oceanic.ApplicationCommandOptionTypes.INTEGER,
            required: false,
            name: "delay",
            description: "The delay between each frame. Defaults to 20."
        }),
        async execute(interaction) {
            await interaction.defer();
            const user = interaction.data.options.getUser("user", true);
            const delay = interaction.data.options.getInteger("delay");
            const url = user.avatarURL("png", 2048);
            // https://cdn.discordapp.com/avatars/766369468347580437/dc7ce45ec5970e0436593b450637a9ab.png?size=1024
            const gif = await PetPetUtils.createGif(url, delay);
            await interaction.editOriginal({ files: [
                    {
                        name: "petpet.gif",
                        contents: gif
                    }
                ] });
        }
    }
];
bot.on("ready", async () => {
    for (const command of commands) {
        console.log(`creating global command ${command.data.name}`);
        collection.set(command.data.name, command);
        bot.application.createGlobalCommand(command.data);
        console.log(`created global command ${command.data.name}`);
    }
});
bot.on("interactionCreate", async (i) => {
    const interaction = i;
    const command = collection.get(interaction.data.name);
    if (!command)
        return;
    try {
        await command.execute(interaction);
    }
    catch (error) {
        if (error)
            console.error(error);
        if (!interaction.acknowledged) {
            await interaction.createMessage({ content: `There was an error while executing this command, error is ${error}` });
        }
        else {
            await interaction.editOriginal({ content: `There was an error while executing this command, error is ${error}` });
        }
    }
});
await bot.connect();
