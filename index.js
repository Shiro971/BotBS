const { 
  Client, 
  GatewayIntentBits, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  InteractionType, 
  EmbedBuilder 
} = require('discord.js');
require('dotenv').config();

const bot = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ] 
});

// Stockage temporaire des réponses utilisateur
const userResponses = new Map();
const GUILD_ID = '1076638219858346126';

// Événement de connexion
bot.once('ready', async () => {
  try {
    await bot.application.commands.set([]);
    console.log('✅ Toutes les commandes globales ont été supprimées.');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des commandes globales:', error);
  }

  console.log(`🤖 Connecté en tant que ${bot.user.tag}`);

  await registerCommands();
});

// Enregistrement des commandes slash
async function registerCommands() {
  try {
    const guild = await bot.guilds.fetch(GUILD_ID);

    if (!guild) {
      console.error("❌ Serveur introuvable !");
      return;
    }

    await guild.commands.set([
      {
        name: "recrutement",
        description: "Ouvrir le formulaire de recrutement"
      }
    ]);

    console.log('✅ Commande /recrutement enregistrée sur le serveur.');
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement des commandes:', error);
  }
}

// Gestion des interactions
bot.on('interactionCreate', async interaction => {
  try {
    if (interaction.isCommand() && interaction.commandName === "recrutement") {
      await handleQuestionnaireCommand(interaction);
    } else if (interaction.type === InteractionType.ModalSubmit) {
      await handleModalSubmit(interaction);
    } else if (interaction.isSelectMenu()) {
      await handleSelectMenu(interaction);
    } else if (interaction.isButton()) {
      await handleButton(interaction);
    }
  } catch (error) {
    console.error('❌ Erreur dans le gestionnaire d\'interaction:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: 'Une erreur est survenue lors du traitement de votre demande.', 
        ephemeral: true 
      });
    }
  }
});

// Gestion de la commande questionnaire
async function handleQuestionnaireCommand(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('recruitment_form')
    .setTitle('Formulaire de Recrutement');

  const fields = [
    createInputField('agehrp', 'Âge HRP', TextInputStyle.Short),
    createInputField('heures', 'Heures de jeu', TextInputStyle.Short),
    createInputField('nomrp', 'Nom RP complet', TextInputStyle.Short),
    createInputField('tel', 'Numéro de téléphone RP', TextInputStyle.Short).setPlaceholder('555-XXX-XXX'),
    createInputField('idUnique', 'ID unique', TextInputStyle.Short)
  ];

  fields.forEach(field => {
    modal.addComponents(new ActionRowBuilder().addComponents(field));
  });

  await interaction.showModal(modal);
}

// Helper pour créer les champs de texte
function createInputField(customId, label, style) {
  return new TextInputBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style)
    .setRequired(true);
}

// Gestion de la soumission du modal
async function handleModalSubmit(interaction) {
  if (interaction.customId !== 'recruitment_form') return;

  const responses = {
    agehrp: interaction.fields.getTextInputValue('agehrp'),
    heures: interaction.fields.getTextInputValue('heures'),
    nomrp: interaction.fields.getTextInputValue('nomrp'),
    contact: interaction.fields.getTextInputValue('tel'),
    idUnique: interaction.fields.getTextInputValue('idUnique')
  };

  userResponses.set(interaction.user.id, responses);

  const disponibilitesSelect = createSelectMenu(
    'disponibilites',
    'Sélectionnez vos disponibilités',
    [
      { label: '00h00 à 03h00', value: '00h00-03h00' },
      { label: '03h00 à 06h00', value: '03h00-06h00' },
      { label: '06h00 à 09h00', value: '06h00-09h00' },
      { label: '09h00 à 11h00', value: '09h00-11h00' },
      { label: '11h00 à 14h00', value: '11h00-14h00' },
      { label: '14h00 à 17h00', value: '14h00-17h00' },
      { label: '17h00 à 20h00', value: '17h00-20h00' },
      { label: '20h00 à 23h00', value: '20h00-23h00' }
    ],
    { min: 1, max: 8 }
  );

  const yesNoOptions = [
    { label: 'Oui', value: 'oui' },
    { label: 'Non', value: 'non' },
    { label: 'Je sais pas', value: 'je sais pas' }
  ];

  const permisBSelect = createSelectMenu('permisb', 'Êtes-vous en possession du permis B ?', yesNoOptions);
  const casierSelect = createSelectMenu('casier', 'Avez-vous un casier judiciaire ?', yesNoOptions);
  const recenseSelect = createSelectMenu('recense', 'Êtes-vous recensé ?', yesNoOptions);

  const validateButton = new ButtonBuilder()
    .setCustomId('validate_form')
    .setLabel('Valider le formulaire')
    .setStyle(ButtonStyle.Success);

  await interaction.reply({
    content: 'Merci pour vos réponses. Veuillez maintenant compléter les informations suivantes :',
    components: [
      new ActionRowBuilder().addComponents(disponibilitesSelect),
      new ActionRowBuilder().addComponents(permisBSelect),
      new ActionRowBuilder().addComponents(casierSelect),
      new ActionRowBuilder().addComponents(recenseSelect),
      new ActionRowBuilder().addComponents(validateButton)
    ],
    ephemeral: true
  });
}

// Helper pour créer les menus déroulants
function createSelectMenu(customId, placeholder, options, { min = 1, max = 1 } = {}) {
  return new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .setMinValues(min)
    .setMaxValues(max)
    .addOptions(options);
}

// Gestion des menus déroulants
async function handleSelectMenu(interaction) {
  const userId = interaction.user.id;
  const customId = interaction.customId;
  const values = interaction.values;

  const responses = userResponses.get(userId) || {};
  responses[customId] = values;
  userResponses.set(userId, responses);

  await interaction.deferUpdate();
}

// Gestion des boutons
async function handleButton(interaction) {
  if (interaction.customId === 'validate_form') {
    const userId = interaction.user.id;
    const responses = userResponses.get(userId) || {};

    const embed = new EmbedBuilder()
      .setColor('#e67e22')
      .setTitle('📋 CANDIDATURE BURGERSHOT')
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`Formulaire soumis par **${interaction.user.tag}**`)
      .addFields(
        { name: '👤 Âge HRP', value: responses.agehrp || 'Non précisé', inline: true },
        { name: '⏳ Heures de jeu', value: responses.heures || 'Non précisé', inline: true },
        { name: '🆔 ID unique', value: responses.idUnique || 'Non précisé', inline: true },
        { name: '🧍 Nom RP', value: responses.nomrp || 'Non précisé', inline: false },
        { name: '📞 Contact', value: responses.contact || 'Non précisé', inline: false },
        { name: '🕒 Disponibilités', value: (responses.disponibilites || ['Non renseigné']).join(', '), inline: false },
        { name: '🚗 Permis B', value: responses.permisb ? `\`${responses.permisb[0]}\`` : 'Non précisé', inline: true },
        { name: '🚨 Casier', value: responses.casier ? `\`${responses.casier[0]}\`` : 'Non précisé', inline: true },
        { name: '📋 Recensé', value: responses.recense ? `\`${responses.recense[0]}\`` : 'Non précisé', inline: true }
      )
      .setFooter({ text: 'Formulaire de recrutement', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp()
      .setImage('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0t6FefzJSQlrXbb2_pCMaPu19xSfKQ6bZcHgGIKdPqi7nxV97_CIazGxTUokbWQUyjgw&usqp=CAU');

    const channel = await interaction.client.channels.fetch(interaction.channel.id);
    if (channel) {
      await channel.send({ embeds: [embed] });
    }

    await interaction.update({
      content: '✅ Votre candidature a été envoyée avec succès !',
      components: []
    });

    userResponses.delete(userId);
  }
}

// Connexion du bot
bot.login(process.env.TOKEN)
  .catch(error => console.error('❌ Erreur de connexion:', error));
