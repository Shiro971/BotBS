const { ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  async handleCommand(interaction) {
    try {
      // Vérifier si l'interaction a déjà été traitée
      if (interaction.replied || interaction.deferred) {
        return console.warn('Interaction déjà traitée', interaction.id);
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('recrutement_dispo')
        .setPlaceholder('Sélectionnez vos disponibilités')
        .setMinValues(1)
        .setMaxValues(7)
        .addOptions([
          { label: '00h00-03h00', value: '00h00-03h00' },
          { label: '03h00-06h00', value: '03h00-06h00' },
          { label: '06h00-09h00', value: '06h00-09h00' },
          { label: '09h00-12h00', value: '09h00-12h00' },
          { label: '12h00-15h00', value: '12h00-15h00' },
          { label: '15h00-18h00', value: '15h00-18h00' },
          { label: '18h00-21h00', value: '18h00-21h00' }
        ]);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({
        content: 'Quelles sont vos disponibilités pour travailler ?',
        components: [row],
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error('Erreur dans handleCommand:', error);
      throw error; // Laisser le gestionnaire principal gérer l'erreur
    }
  },

  async handleSelectMenu(interaction) {
    try {
      if (interaction.replied || interaction.deferred) {
        return console.warn('Interaction déjà traitée', interaction.id);
      }

      if (interaction.customId === 'recrutement_dispo') {
        const modal = new ModalBuilder()
          .setCustomId('recrutement_modal')
          .setTitle('Formulaire de recrutement');

        const permisInput = new TextInputBuilder()
          .setCustomId('permisb')
          .setLabel("Possédez-vous un permis B valide ?")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const casierInput = new TextInputBuilder()
          .setCustomId('casier')
          .setLabel("Avez-vous un casier judiciaire vierge ?")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const recenseInput = new TextInputBuilder()
          .setCustomId('recense')
          .setLabel("Êtes-vous recensé ? (si applicable)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(permisInput);
        const secondActionRow = new ActionRowBuilder().addComponents(casierInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(recenseInput);

        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

        await interaction.showModal(modal);
      }
    } catch (error) {
      console.error('Erreur dans handleSelectMenu:', error);
      throw error;
    }
  },

  async handleModalSubmit(interaction) {
    try {
      if (interaction.replied || interaction.deferred) {
        return console.warn('Interaction déjà traitée', interaction.id);
      }

      const permisb = interaction.fields.getTextInputValue('permisb');
      const casier = interaction.fields.getTextInputValue('casier');
      const recense = interaction.fields.getTextInputValue('recense');
      const disponibilites = interaction.values || [];

      // Validation des réponses
      if (!permisb || !casier || !recense) {
        return await interaction.reply({
          content: 'Tous les champs sont obligatoires.',
          flags: MessageFlags.Ephemeral
        });
      }

      // Création de l'embed
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Nouvelle candidature')
        .setDescription(`Candidature de ${interaction.user.tag}`)
        .addFields(
          { name: 'Disponibilités', value: disponibilites.join(', ') || 'Non spécifié' },
          { name: 'Permis B', value: permisb || 'Non spécifié' },
          { name: 'Casier judiciaire', value: casier || 'Non spécifié' },
          { name: 'Recensement', value: recense || 'Non spécifié' }
        )
        .setTimestamp();

      await interaction.reply({
        content: 'Votre candidature a été soumise avec succès!',
        flags: MessageFlags.Ephemeral
      });

      // Envoyer l'embed dans un channel spécifique
      const channel = interaction.guild.channels.cache.get('VOTRE_CHANNEL_ID');
      if (channel) {
        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Erreur dans handleModalSubmit:', error);
      throw error;
    }
  },
};