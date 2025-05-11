const { Client, GatewayIntentBits, InteractionType } = require('discord.js');
require('dotenv').config();

const recruitmentHandler = require('./handlers/recruitmentHandler');
const rdvHandler = require('./handlers/rdvHandler');
const refHandler = require('./handlers/refHandler');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers // Ajouté pour mieux gérer les membres
  ] 
});

const GUILD_ID = '1076638219858346126';

client.once('ready', async () => {
  console.log(`🤖 Connecté en tant que ${client.user.tag}`);
  try {
    await registerCommands();
    console.log('✅ Prêt à recevoir des commandes');
  } catch (error) {
    console.error('❌ Erreur lors de la préparation:', error);
  }
});

async function registerCommands() {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.commands.set([
      { 
        name: "recrutement", 
        description: "Ouvrir le formulaire de recrutement",
        options: [] 
      },
      { 
        name: "acc", 
        description: "Fixer un rendez-vous pour une formation",
        options: [] 
      },
      { 
        name: "ref", 
        description: "Refuser une candidature",
        options: [] 
      }
    ]);
    console.log('✅ Commandes enregistrées');
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement des commandes:', error);
  }
}

client.on('interactionCreate', async interaction => {
  if (!interaction.inGuild()) return;

  try {
    if (interaction.isCommand()) {
      switch (interaction.commandName) {
        case "recrutement":
          await recruitmentHandler.handleQuestionnaireCommand(interaction);
          break;
        case "acc":
          await rdvHandler.handleCommand(interaction);
          break;
        case "ref":
          await refHandler.handleCommand(interaction);
          break;
      }
    } 
    else if (interaction.type === InteractionType.ModalSubmit) {
      if (interaction.customId === 'recruitment_form') {
        await recruitmentHandler.handleModalSubmit(interaction);
      } 
      else if (interaction.customId === 'modal_rdv') {
        await rdvHandler.handleModalSubmit(interaction);
      }
    } 
    else if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('disponibilites') || 
          interaction.customId.startsWith('permisb') || 
          interaction.customId.startsWith('casier') || 
          interaction.customId.startsWith('recense')) {
        await recruitmentHandler.handleSelectMenu(interaction);
      }
    } 
    else if (interaction.isButton()) {
      if (interaction.customId === 'validate_form') {
        await recruitmentHandler.handleButton(interaction);
      }
      else if (interaction.customId.startsWith('select_')) {
        await rdvHandler.handleButtons(interaction);
      } 
      else if (interaction.customId === 'confirm_ref' || interaction.customId === 'cancel_ref') {
        await refHandler.handleButton(interaction);
      }
    }
  } catch (error) {
    console.error('❌ Erreur dans interactionCreate:', error);
    
    try {
      if (interaction.isRepliable()) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: '❌ Une erreur est survenue lors du traitement de votre demande.',
            ephemeral: true
          });
        } else {
          await interaction.reply({
            content: '❌ Une erreur est survenue lors du traitement de votre demande.',
            ephemeral: true
          });
        }
      }
    } catch (err) {
      console.error('❌ Impossible d\'envoyer le message d\'erreur:', err);
    }
  }
});

client.login(process.env.TOKEN).catch(error => {
  console.error('❌ Échec de la connexion:', error);
  process.exit(1);
});