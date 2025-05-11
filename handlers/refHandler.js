const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    handleCommand: async (interaction) => {

            const REQUIRED_ROLE_ID = '1076685983724085371';

            if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return interaction.reply({
                content: '⛔ Vous n\'avez pas le rôle requis pour utiliser cette commande.',
                ephemeral: true,
            });
            }
        // Créer des boutons pour confirmer ou annuler
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_ref')
                    .setLabel('Confirmer le refus')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_ref')
                    .setLabel('Annuler')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Demander confirmation
        await interaction.reply({
            content: '⚠️ Vous êtes sur le point d\'envoyer un message de refus au candidat. Confirmez-vous ?',
            components: [row],
            ephemeral: true
        });
    },

    handleButton: async (interaction) => {
        if (interaction.customId === 'confirm_ref') {
            // Message de refus automatique
            const refusalMessage = `## Merci beaucoup pour l'intérêt que vous avez porté au Burger Shot 🍔\n\n` +
                                 ` **Après une réflexion approfondie, __nous avons décidé de ne pas donner suite à votre candidature.__**\n` +
                                 ` **Nous vous souhaitons beaucoup de succès dans vos projets futurs** 🙏 `;

            await interaction.update({
                content: '✅ Message de refus envoyé avec succès',
                components: [],
                ephemeral: true
            });

            // Envoyer le message dans le channel (adaptez selon vos besoins)
            await interaction.channel.send(refusalMessage);

        } else if (interaction.customId === 'cancel_ref') {
            await interaction.update({
                content: '❌ Refus annulée',
                components: [],
                ephemeral: true
            });
        }
    }
};