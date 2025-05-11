const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  handleCommand: async (interaction) => {
    const REQUIRED_ROLE_ID = '1076685983724085371';

    if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
      return interaction.reply({
        content: '⛔ Vous n\'avez pas le rôle requis pour utiliser cette commande.',
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_rdv')
      .setTitle('Saisir vos créneaux')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('date_1')
            .setLabel('1ère date et heure (ex : Lundi 21h)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(50) // Ajout d'une limite de caractères
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('date_2')
            .setLabel('2ème date et heure (ex : Mardi 10h)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(50) // Ajout d'une limite de caractères
        )
      );

    await interaction.showModal(modal);
  },

  handleModalSubmit: async (interaction) => {
    const date1 = interaction.fields.getTextInputValue('date_1').trim();
    const date2 = interaction.fields.getTextInputValue('date_2').trim();

    // Validation simple des dates
    if (!date1 || !date2) {
      return interaction.reply({
        content: '❌ Veuillez fournir deux créneaux valides.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#32CD32')
      .setTitle('🎉 Félicitations !')
      .setDescription(
        `Tu as été **accepté(e)** au Burger Shot !\n\n🍔 La prochaine étape consiste à suivre une **formation obligatoire**.\n\nMerci de choisir l'un des deux créneaux proposés par ton formateur pour y participer :`
      )
      .addFields(
        { name: 'Créneau 1', value: date1, inline: true },
        { name: 'Créneau 2', value: date2, inline: true }
      )
      .setFooter({ text: 'Confirmation de rendez-vous de formation' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`select_date_1:${encodeURIComponent(date1)}`)
        .setLabel(`Choisir: ${date1.substring(0, 15)}${date1.length > 15 ? '...' : ''}`)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`select_date_2:${encodeURIComponent(date2)}`)
        .setLabel(`Choisir: ${date2.substring(0, 15)}${date2.length > 15 ? '...' : ''}`)
        .setStyle(ButtonStyle.Success),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },

  handleButtons: async (interaction) => {
    try {
        if (interaction.customId.startsWith('select_date_')) {
            const selectedDate = decodeURIComponent(interaction.customId.split(':')[1]);

            // Modifier le nom du salon
            try {
                const channelName = `rdv-${selectedDate.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50)}`;
                await interaction.channel.setName(channelName);
            } catch (error) {
                console.error('Erreur modification salon:', error);
            }

            const embed = new EmbedBuilder()
                .setColor('#32CD32')
                .setTitle('🎉 Rendez-vous confirmé !')
                .setDescription(
                    `Voici les détails :\n\n**Créneau choisi :** ${selectedDate}\n\nTu recevras un rappel avant la formation.\n\nÀ très bientôt au Burger Shot !`
                )
                .setFooter({ text: 'Confirmation finale de rendez-vous' })
                .setTimestamp();

            await interaction.deferUpdate();
            await interaction.editReply({
                components: [],
                embeds: [embed]
            });

        }
    } catch (error) {
        console.error('Erreur dans handleButtons:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Une erreur est survenue lors du traitement de votre demande.',
                ephemeral: true
            });
        } else {
            await interaction.followUp({
                content: '❌ Une erreur est survenue lors du traitement de votre demande.',
                ephemeral: true
            });
        }
    }
},
};