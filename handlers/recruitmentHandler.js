const { 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  InteractionResponseFlags
} = require('discord.js');

const userResponses = new Map();

async function handleQuestionnaireCommand(interaction) {
  try {
    const modal = new ModalBuilder()
      .setCustomId('recruitment_form')
      .setTitle('Formulaire de Recrutement');

    const fields = [
      { id: 'agehrp', label: 'Âge HRP' },
      { id: 'heures', label: 'Heures de jeu', placeholder: '800 heures de jeu' },
      { id: 'nomrp', label: 'Nom RP complet' },
      { id: 'tel', label: 'Numéro de téléphone RP', placeholder: '555-XXX-XXX' },
      { id: 'idUnique', label: 'ID unique' }
    ];

    fields.forEach(({ id, label, placeholder }) => {
      const input = new TextInputBuilder()
        .setCustomId(id)
        .setLabel(label)
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      if (placeholder) input.setPlaceholder(placeholder);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
    });

    await interaction.showModal(modal);
  } catch (error) {
    console.error('❌ Erreur dans handleQuestionnaireCommand:', error);
    await interaction.reply({
      content: 'Erreur lors de l\'ouverture du formulaire',
      flags: InteractionResponseFlags.Ephemeral
    }).catch(console.error);
  }
}

async function handleModalSubmit(interaction) {
  if (interaction.customId !== 'recruitment_form') return;

  try {
    await interaction.deferReply({ ephemeral: true });

    const responses = {
      agehrp: interaction.fields.getTextInputValue('agehrp') || 'Non précisé',
      heures: interaction.fields.getTextInputValue('heures') || 'Non précisé',
      nomrp: interaction.fields.getTextInputValue('nomrp') || 'Non précisé',
      contact: interaction.fields.getTextInputValue('tel') || 'Non précisé',
      idUnique: interaction.fields.getTextInputValue('idUnique') || 'Non précisé'
    };

    userResponses.set(interaction.user.id, responses);

    const yesNoOptions = [
      { label: 'Oui', value: 'oui' },
      { label: 'Non', value: 'non' },
      { label: 'Je sais pas', value: 'je sais pas' }
    ];

    await interaction.editReply({
      content: 'Merci pour vos réponses. Veuillez maintenant compléter les informations suivantes :',
      components: [
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('disponibilites')
            .setPlaceholder('Sélectionnez vos disponibilités')
            .setMinValues(1)
            .setMaxValues(8)
            .addOptions([
              { label: '00h00 à 03h00', value: '00h00-03h00' },
              { label: '03h00 à 06h00', value: '03h00-06h00' },
              { label: '06h00 à 09h00', value: '06h00-09h00' },
              { label: '09h00 à 11h00', value: '09h00-11h00' },
              { label: '11h00 à 14h00', value: '11h00-14h00' },
              { label: '14h00 à 17h00', value: '14h00-17h00' },
              { label: '17h00 à 20h00', value: '17h00-20h00' },
              { label: '20h00 à 23h00', value: '20h00-23h00' }
            ])
        ),
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('permisb')
            .setPlaceholder('Permis B ?')
            .addOptions(yesNoOptions)
        ),
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('casier')
            .setPlaceholder('Casier judiciaire ?')
            .addOptions(yesNoOptions)
        ),
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('recense')
            .setPlaceholder('Recensé ?')
            .addOptions(yesNoOptions)
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('validate_form')
            .setLabel('Valider')
            .setStyle(ButtonStyle.Success)
        )
      ]
    });
  } catch (error) {
    console.error('❌ Erreur dans handleModalSubmit:', error);
    await interaction.followUp({
      content: 'Erreur lors du traitement du formulaire',
      ephemeral: true
    }).catch(console.error);
  }
}

async function handleSelectMenu(interaction) {
  try {
    const userId = interaction.user.id;
    const responses = userResponses.get(userId) || {};

    responses[interaction.customId] = interaction.values;
    userResponses.set(userId, responses);

    await interaction.deferUpdate();
  } catch (error) {
    console.error('❌ Erreur dans handleSelectMenu:', error);
    await interaction.reply({ 
      content: 'Erreur lors de la sauvegarde', 
      flags: InteractionResponseFlags.Ephemeral
    }).catch(console.error);
  }
}

async function handleButton(interaction) {
  if (interaction.customId !== 'validate_form') return;

  try {
    const userId = interaction.user.id;
    const responses = userResponses.get(userId);

    if (!responses) {
      return await interaction.reply({ 
        content: 'Aucune donnée trouvée, veuillez recommencer.', 
        ephemeral: true
      });
    }

    const requiredFields = ['agehrp', 'heures', 'nomrp', 'contact', 'idUnique', 
                          'disponibilites', 'permisb', 'casier', 'recense'];
    const missingFields = requiredFields.filter(field => !responses[field]);

    if (missingFields.length > 0) {
      return await interaction.reply({
        content: `Il manque des informations: ${missingFields.join(', ')}`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#e67e22')
      .setTitle('📋 CANDIDATURE BURGERSHOT')
      .setThumbnail(interaction.user.displayAvatarURL())
      .setDescription(`Formulaire soumis par ${interaction.user.tag}`)
      .addFields(
        { name: '👤 Âge HRP', value: responses.agehrp, inline: true },
        { name: '⏳ Heures de jeu', value: responses.heures, inline: true },
        { name: '🆔 ID unique', value: responses.idUnique, inline: true },
        { name: '🧍 Nom RP', value: responses.nomrp, inline: false },
        { name: '📞 Contact', value: responses.contact, inline: false },
        { name: '🕒 Disponibilités', value: responses.disponibilites.join(', '), inline: false },
        { name: '🚗 Permis B', value: responses.permisb[0], inline: true },
        { name: '🚨 Casier', value: responses.casier[0], inline: true },
        { name: '📋 Recensé', value: responses.recense[0], inline: true }
      )
      .setFooter({ 
        text: 'Formulaire de recrutement', 
        iconURL: interaction.client.user.displayAvatarURL() 
      })
      .setTimestamp();

    await interaction.update({
      content: 'Le formulaire a été validé, merci !',
      components: []
    });

    await interaction.channel.send({ embeds: [embed] });
    await interaction.followUp({ 
      content: '✅ Candidature envoyée avec succès !', 
      ephemeral: true 
    });

    userResponses.delete(userId);
  } catch (error) {
    console.error('❌ Erreur dans handleButton:', error);
    await interaction.reply({ 
      content: 'Une erreur est survenue, veuillez réessayer.', 
      ephemeral: true
    });
  }
}

module.exports = {
  handleQuestionnaireCommand,
  handleModalSubmit,
  handleSelectMenu,
  handleButton
};