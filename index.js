const { Client, GatewayIntentBits, InteractionType, MessageFlags } = require('discord.js');
require('dotenv').config();

const recruitmentHandler = require('./handlers/recruitmentHandler');
const rdvHandler = require('./handlers/rdvHandler');
const refHandler = require('./handlers/refHandler');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ] 
});

const GUILD_ID = '1076638219858346126';

client.once('ready', async () => {
  console.log(`🤖 Connecté en tant que ${client.user.tag}`);
  await registerCommands();
});

async function registerCommands() {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.commands.set([
      { 
        name: "recrutement", 
        description: "Ouvrir le formulaire de recrutement" 
      },
      { 
        name: "acc", 
        description: "Permet de fixer un rendez-vous pour une formation" 
      },
      { 
        name: "ref", 
        description: "Permet de refuser une candidature" 
      }
    ]);
    console.log('✅ Commandes enregistrées');
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement:', error);
  }
}

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isCommand()) {
      switch (interaction.commandName) {
        case "recrutement":
          console.log('✅ handleCommand called, ID:', interaction.id);
          await recruitmentHandler.handleCommand(interaction);
          break;
        case "acc":
          await rdvHandler.handleCommand(interaction);
          break;
        case "ref":
          await refHandler.handleCommand(interaction);
          break;
      }
    } else if (interaction.type === InteractionType.ModalSubmit) {
      if (interaction.customId.startsWith('recrutement')) {
        await recruitmentHandler.handleModalSubmit(interaction);
      } else if (interaction.customId === 'modal_rdv') {
        await rdvHandler.handleModalSubmit(interaction);
      }
    } else if (interaction.isStringSelectMenu()) {
      await recruitmentHandler.handleSelectMenu(interaction);
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith('select_')) {
        await rdvHandler.handleButtons(interaction);
      } else if (interaction.customId === 'confirm_ref') {
        await refHandler.handleButton(interaction);
      } else if (interaction.customId === 'cancel_ref') {
        await refHandler.handleButton(interaction);
      }
    }
  } catch (error) {
    console.error('❌ Erreur dans interactionCreate:', error.stack || error.message, 'Interaction ID:', interaction.id);
    
    try {
      if (interaction.isCommand() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'Une erreur est survenue lors du traitement de votre demande.',
          flags: MessageFlags.Ephemeral
        });
      } else if (!interaction.replied && !interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue lors du traitement de votre demande.',
          flags: MessageFlags.Ephemeral,
          ephemeral: true
        });
      }
    } catch (err) {
      console.error('❌ Impossible d\'envoyer le message d\'erreur:', err);
    }
  }
});

client.login(process.env.TOKEN).catch(console.error);